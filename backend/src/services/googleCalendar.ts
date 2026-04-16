import crypto from 'crypto';
import { google, calendar_v3 } from 'googleapis';
import prisma from '../lib/prisma';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

const ENC_ALGO = 'aes-256-gcm';

const getEncryptionKey = (): Buffer => {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is required');
  }

  const value = raw.trim();

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Buffer.from(value, 'hex');
  }

  try {
    const fromBase64 = Buffer.from(value, 'base64');
    if (fromBase64.length === 32) {
      return fromBase64;
    }
  } catch {
    // ignore and fallback
  }

  const utf8 = Buffer.from(value, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }

  throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes (hex/base64/plain)');
};

const encryptToken = (plainToken: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainToken, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptToken = (encryptedPayload: string): string => {
  const key = getEncryptionKey();
  const [ivPart, authTagPart, encryptedPart] = encryptedPayload.split(':');

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Malformed encrypted token payload');
  }

  const iv = Buffer.from(ivPart, 'base64');
  const authTag = Buffer.from(authTagPart, 'base64');
  const encrypted = Buffer.from(encryptedPart, 'base64');

  const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

export const googleCalendarScopes = [...GOOGLE_SCOPES];

export const getGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth env vars are missing');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

export const upsertGoogleTokens = async (
  userId: string,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    token_type?: string | null;
    scope?: string | null;
  }
): Promise<void> => {
  const existing = await prisma.googleCalendarAuth.findUnique({ where: { userId } });

  const accessTokenSource = tokens.access_token || (existing ? decryptToken(existing.encryptedAccessToken) : null);
  const refreshTokenSource = tokens.refresh_token || (existing ? decryptToken(existing.encryptedRefreshToken) : null);

  if (!accessTokenSource || !refreshTokenSource) {
    throw new Error('Google OAuth tokens are incomplete');
  }

  await prisma.googleCalendarAuth.upsert({
    where: { userId },
    update: {
      encryptedAccessToken: encryptToken(accessTokenSource),
      encryptedRefreshToken: encryptToken(refreshTokenSource),
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : existing?.expiryDate || null,
      tokenType: tokens.token_type || existing?.tokenType || 'Bearer',
      scope: tokens.scope || existing?.scope || GOOGLE_SCOPES.join(' '),
    },
    create: {
      userId,
      encryptedAccessToken: encryptToken(accessTokenSource),
      encryptedRefreshToken: encryptToken(refreshTokenSource),
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      tokenType: tokens.token_type || 'Bearer',
      scope: tokens.scope || GOOGLE_SCOPES.join(' '),
    },
  });
};

export const getValidGoogleAccessToken = async (userId: string): Promise<string | null> => {
  const auth = await prisma.googleCalendarAuth.findUnique({ where: { userId } });

  if (!auth) {
    return null;
  }

  const isExpired = !auth.expiryDate || auth.expiryDate.getTime() <= Date.now() + 60 * 1000;

  if (!isExpired) {
    return decryptToken(auth.encryptedAccessToken);
  }

  const refreshToken = decryptToken(auth.encryptedRefreshToken);
  const oauthClient = getGoogleOAuthClient();
  oauthClient.setCredentials({ refresh_token: refreshToken });

  try {
    const refreshed = await oauthClient.refreshAccessToken();
    const credentials = refreshed.credentials;

    await upsertGoogleTokens(userId, {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date,
      token_type: credentials.token_type,
      scope: credentials.scope,
    });

    return credentials.access_token || null;
  } catch (error) {
    console.error('Google token refresh failed:', error);
    return null;
  }
};

export const getGoogleCalendarClient = async (userId: string): Promise<calendar_v3.Calendar> => {
  const accessToken = await getValidGoogleAccessToken(userId);

  if (!accessToken) {
    throw new Error('Google Calendar is not connected');
  }

  const oauthClient = getGoogleOAuthClient();
  oauthClient.setCredentials({ access_token: accessToken });

  return google.calendar({ version: 'v3', auth: oauthClient });
};

export const getCalendarConnectionStatus = async (userId: string) => {
  const auth = await prisma.googleCalendarAuth.findUnique({
    where: { userId },
    select: { expiryDate: true, updatedAt: true },
  });

  return {
    connected: Boolean(auth),
    expiryDate: auth?.expiryDate?.toISOString() || null,
    updatedAt: auth?.updatedAt.toISOString() || null,
  };
};

export const revokeGoogleConnection = async (userId: string) => {
  const auth = await prisma.googleCalendarAuth.findUnique({ where: { userId } });
  if (!auth) {
    return;
  }

  try {
    const token = decryptToken(auth.encryptedAccessToken);
    const oauthClient = getGoogleOAuthClient();
    await oauthClient.revokeToken(token);
  } catch (error) {
    console.warn('Google token revoke warning:', error);
  }

  await prisma.googleCalendarAuth.delete({ where: { userId } });
};
