/**
 * ── Email normalization + lookup helpers ──────────────────────────────────
 *
 * Gmail and Googlemail share one inbox, and Gmail ignores dots and '+'-tags
 * in the local part — so the same mailbox can surface as different strings.
 * If those strings were treated as distinct emails, one mailbox could end up
 * with multiple Meetiva accounts, which then collide on the unique googleId
 * index ("A record with this googleId already exists.").
 *
 * Apply `normalizeEmail` wherever an email is STORED (register, profile
 * change, team invites, corporate provisioning) and use `emailQueryFilter`
 * wherever an email is LOOKED UP (login, OTP, password reset, account
 * linking, invitations) so one mailbox always maps to one account.
 */

/**
 * Normalize an email to its canonical form: lowercase + trim, googlemail.com
 * → gmail.com, and (for Gmail only) strip dots and '+'-tags from the local
 * part. Non-Gmail addresses are left untouched.
 */
export const normalizeEmail = (rawEmail: string): string => {
  let email = rawEmail.toLowerCase().trim();
  if (email.endsWith('@googlemail.com')) {
    email = `${email.slice(0, -'@googlemail.com'.length)}@gmail.com`;
  }
  const at = email.lastIndexOf('@');
  if (at > 0) {
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    if (domain === 'gmail.com') {
      return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
    }
  }
  return email;
};

/**
 * Lookup candidates for an email: the canonical form first, then the raw
 * (lowercased/trimmed) input. The raw fallback keeps accounts that were
 * created before normalization existed (e.g. "john.smith@gmail.com")
 * reachable when the user types the same form again.
 */
const emailLookupCandidates = (email: string): string[] => {
  const normalized = normalizeEmail(email);
  const lower = email.toLowerCase().trim();
  return normalized === lower ? [normalized] : [normalized, lower];
};

/**
 * Query filter that matches a user-supplied email, including legacy records:
 * - the canonical form, then the raw input (via $in), and
 * - for Gmail, any dot-placement of the local part (via a bounded regex), so
 *   a pre-normalization record like "john.smith@gmail.com" is still found
 *   when the user types — or Google returns — "johnsmith@gmail.com".
 *
 * Returns a filter object safe to pass to `findOne`/`find` directly or to
 * spread alongside other conditions.
 */
export const emailQueryFilter = (email: string): Record<string, unknown> => {
  const candidates = emailLookupCandidates(email);
  const dotRegex = gmailDotVariantRegex(email);
  if (!dotRegex) {
    return { email: { $in: candidates } };
  }
  return {
    $or: [
      { email: { $in: candidates } },
      { email: { $regex: dotRegex, $options: 'i' } },
    ],
  };
};

/**
 * Regex matching any dot-placement of a Gmail local part (e.g. johnsmith →
 * john.smith, j.ohns.mith, ...). Bounded to short local parts: the pattern
 * grows 2^n paths, so long usernames skip the fallback (rare, and unlikely
 * to have a dotted legacy twin).
 */
const gmailDotVariantRegex = (email: string): RegExp | null => {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at <= 0) return null;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (domain !== 'gmail.com' || !local || local.length > 20) return null;
  const pattern = local
    .split('')
    .map((ch) => `${ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.?`)
    .join('');
  return new RegExp(`^${pattern}@gmail\\.com$`, 'i');
};
