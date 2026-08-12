import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export interface PasswordHash {
  salt: string;
  hashedPassword: string;
}

/**
 * Hash a plaintext password with a freshly generated random salt.
 *
 * Returns both the salt and the bcrypt hash so callers can persist the salt
 * in a dedicated `passwordSalt` column on the user record. The salt is also
 * embedded in the bcrypt hash string itself, so `verifyPassword` works even
 * for legacy records created before the explicit salt column existed.
 */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return { salt, hashedPassword };
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * bcrypt.compare extracts the salt embedded in the hash automatically.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
