/**
 * Unit tests for Firebase Storage helper functions (pure logic only — no
 * network/firebase-admin needed). Run with: npx tsx src/tests/firebaseStorage.test.ts
 */
import {
  sanitizeStorageFilename,
  getFileKind,
  isFirebaseStorageConfigured,
  FIREBASE_SIGNED_URL_TTL_SECONDS,
} from '../lib/firebaseStorage';

let pass = 0;
let fail = 0;

const assert = (condition: boolean, name: string) => {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.error('  FAIL:', name);
  }
};

console.log('\n── sanitizeStorageFilename ──');
assert(sanitizeStorageFilename('meeting notes.mp3') === 'meeting_notes.mp3', 'spaces become underscores');
assert(sanitizeStorageFilename('../../etc/passwd') === 'passwd', 'posix path traversal stripped');
assert(sanitizeStorageFilename('C:\\Users\\x\\rec.wav') === 'rec.wav', 'windows path stripped');
assert(sanitizeStorageFilename('a@b#c$.mp4') === 'a_b_c.mp4', 'special chars sanitized');
assert(sanitizeStorageFilename('!!') === '_', 'only-invalid chars collapse to underscore');
assert(sanitizeStorageFilename('..') === 'file', 'empty base falls back to "file"');
assert(sanitizeStorageFilename('') === 'file', 'empty name falls back to "file"');
assert(sanitizeStorageFilename('a'.repeat(200) + '.mp3').length <= 80, 'long names truncated to 80 chars');
assert(sanitizeStorageFilename('.hidden.mp3') === 'hidden.mp3', 'leading dots stripped');

console.log('\n── getFileKind ──');
assert(getFileKind('meeting.mp3') === 'audio', 'mp3 → audio');
assert(getFileKind('rec.wav') === 'audio', 'wav → audio');
assert(getFileKind('rec.m4a') === 'audio', 'm4a → audio');
assert(getFileKind('clip.mp4') === 'video', 'mp4 → video');
assert(getFileKind('clip.mov') === 'video', 'mov → video');
assert(getFileKind('clip.avi') === 'video', 'avi → video');
assert(getFileKind('CLIP.MP4') === 'video', 'uppercase ext → video');
assert(getFileKind('notes.txt') === 'text', 'txt → text');
assert(getFileKind('data.xlsx') === 'text', 'unknown ext → text');
assert(getFileKind('noextension') === 'text', 'no ext → text');

console.log('\n── isFirebaseStorageConfigured ──');
const saved = {
  bucket: process.env.FIREBASE_STORAGE_BUCKET,
  creds: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  sa: process.env.FIREBASE_SERVICE_ACCOUNT,
};
const resetEnv = () => {
  delete process.env.FIREBASE_STORAGE_BUCKET;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
};
try {
  resetEnv();
  assert(isFirebaseStorageConfigured() === false, 'no config → false');
  process.env.FIREBASE_STORAGE_BUCKET = 'meetiva-test.appspot.com';
  assert(isFirebaseStorageConfigured() === false, 'bucket only → false');
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/key.json';
  assert(isFirebaseStorageConfigured() === true, 'bucket + credentials path → true');
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  process.env.FIREBASE_SERVICE_ACCOUNT = '{"type":"service_account"}';
  assert(isFirebaseStorageConfigured() === true, 'bucket + inline service account → true');
} finally {
  if (saved.bucket) process.env.FIREBASE_STORAGE_BUCKET = saved.bucket;
  else delete process.env.FIREBASE_STORAGE_BUCKET;
  if (saved.creds) process.env.GOOGLE_APPLICATION_CREDENTIALS = saved.creds;
  else delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saved.sa) process.env.FIREBASE_SERVICE_ACCOUNT = saved.sa;
  else delete process.env.FIREBASE_SERVICE_ACCOUNT;
}

console.log('\n── FIREBASE_SIGNED_URL_TTL_SECONDS ──');
assert(FIREBASE_SIGNED_URL_TTL_SECONDS === 604800, 'default TTL is 7 days');

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
