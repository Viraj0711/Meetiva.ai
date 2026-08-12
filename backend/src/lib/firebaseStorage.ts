import { createLogger } from './logger';
import { AppError } from './errors';

const log = createLogger('firebase-storage');

// Default signed URL lifetime: 7 days. Configure via FIREBASE_SIGNED_URL_TTL (seconds).
export const FIREBASE_SIGNED_URL_TTL_SECONDS = (() => {
  const raw = Number(process.env.FIREBASE_SIGNED_URL_TTL);
  return Number.isFinite(raw) && raw > 0 ? raw : 7 * 24 * 60 * 60;
})();

/**
 * True when enough Firebase config exists to persist files.
 * Storage is optional: without it meeting uploads still work, the raw file is
 * just not kept (only the transcript is stored in MongoDB).
 */
export const isFirebaseStorageConfigured = (): boolean =>
  Boolean(
    process.env.FIREBASE_STORAGE_BUCKET &&
      (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT)
  );

// ── File categorization helpers (pure, unit-tested) ─────────────────────────

const MEDIA_EXTENSIONS = new Set([
  'mp3', 'wav', 'm4a', 'aac', 'mpeg', 'mpga', 'webm', 'ogg', 'mp4', 'mov', 'avi',
]);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi']);

/** Categorize an uploaded file so the right URL field + player are used. */
export const getFileKind = (originalname: string): 'audio' | 'video' | 'text' => {
  const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (MEDIA_EXTENSIONS.has(ext)) return 'audio';
  return 'text';
};

/** Strip path separators + dangerous characters from an uploaded filename. */
export const sanitizeStorageFilename = (originalname: string): string => {
  const base = originalname.replace(/\\/g, '/').split('/').pop() ?? 'file';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/_+(?=\.)/g, '') // no trailing underscore before the extension
    .slice(0, 80)
    .replace(/^\.+/, '');
  return cleaned || 'file';
};

// ── Firebase admin (lazy-loaded so the app boots without credentials) ───────

type AnyAdmin = any;

let adminModule: AnyAdmin | null = null;
let bucketInstance: AnyAdmin | null = null;

const loadAdmin = async (): Promise<AnyAdmin> => {
  if (!isFirebaseStorageConfigured()) {
    throw new AppError(
      500,
      'Firebase Storage is not configured. Set FIREBASE_STORAGE_BUCKET plus ' +
        'GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) or FIREBASE_SERVICE_ACCOUNT (inline JSON).'
    );
  }
  if (!adminModule) {
    const mod = (await import('firebase-admin')) as AnyAdmin;
    adminModule = mod.default ?? mod;
    if (adminModule.apps.length === 0) {
      adminModule.initializeApp({
        credential: resolveCredential(adminModule),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }
  return adminModule;
};

const resolveCredential = (admin: AnyAdmin): AnyAdmin => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    return admin.credential.cert(JSON.parse(json));
  }
  // Uses GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) via ADC.
  return admin.credential.applicationDefault();
};

const getBucket = async (): Promise<AnyAdmin> => {
  if (!bucketInstance) {
    const admin = await loadAdmin();
    bucketInstance = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
  }
  return bucketInstance;
};

const objectNameFrom = (storagePath: string): string =>
  storagePath.replace(/^gs:\/\/[^/]+\//, '');

// ── Public API ───────────────────────────────────────────────────────────────

export interface StoredFileInfo {
  /** Object path in the bucket, e.g. meetings/<meetingId>/<ts>-<name> */
  storagePath: string;
  /** Freshly generated signed URL (browser-accessible until it expires). */
  signedUrl: string;
}

/**
 * Upload a file buffer to Firebase Storage under meetings/<meetingId>/ and
 * return the object path + a fresh signed read URL.
 */
export const uploadMeetingFile = async (params: {
  buffer: Buffer;
  originalname: string;
  mimeType: string;
  meetingId: string;
}): Promise<StoredFileInfo> => {
  const bucket = await getBucket();
  const safeName = sanitizeStorageFilename(params.originalname);
  const storagePath = `meetings/${params.meetingId}/${Date.now()}-${safeName}`;
  const contentType = params.mimeType || 'application/octet-stream';

  const file = bucket.file(storagePath);
  await file.save(params.buffer, {
    resumable: false,
    contentType,
    metadata: { contentType },
  });

  const signedUrl = await getSignedUrlForPath(storagePath);
  return { storagePath, signedUrl };
};

/**
 * Generate a fresh signed read URL for a stored object. Signed URLs expire
 * (default 7 days) — call this to refresh, e.g. from GET /meetings/:id/file-url.
 */
export const getSignedUrlForPath = async (storagePath: string): Promise<string> => {
  const bucket = await getBucket();
  const [url] = await bucket.file(objectNameFrom(storagePath)).getSignedUrl({
    action: 'read',
    expires: Date.now() + FIREBASE_SIGNED_URL_TTL_SECONDS * 1000,
  });
  return url;
};

/**
 * Delete a stored object. Never throws — cleanup failures are logged and
 * ignored so meeting deletion is never blocked by storage issues.
 */
export const deleteFileFromFirebase = async (storagePath: string): Promise<void> => {
  try {
    if (!isFirebaseStorageConfigured()) return;
    const bucket = await getBucket();
    await bucket.file(objectNameFrom(storagePath)).delete();
  } catch (err) {
    log.warn('Failed to delete file from Firebase Storage', {
      storagePath,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
