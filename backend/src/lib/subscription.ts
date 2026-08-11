import { AppError } from './errors';
import User from '../models/User';
import { Types } from 'mongoose';

// ── Tier limits ────────────────────────────────────────────────────────────

const MONTHLY_MEETING_LIMITS: Record<string, number> = {
  FREE: 5,
  PRO: 999_999, // effectively unlimited
  TEAM: 999_999,
};

const TIERS_REQUIRING_SUBSCRIPTION = ['PRO', 'TEAM'];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check if a user has an active subscription.
 * PRO and TEAM tiers are considered active. FREE is not.
 */
export const hasActiveSubscription = (tier: string, expiresAt?: Date | null): boolean => {
  if (tier === 'PRO' || tier === 'TEAM') {
    // If the subscription has an expiry, check it hasn't passed
    if (expiresAt && expiresAt < new Date()) {
      return false;
    }
    return true;
  }
  return false;
};

/**
 * Ensure the user's meeting count is reset if a new month has started.
 * Returns the (possibly updated) user record.
 */
export const ensureMeetingCountReset = async (userId: string): Promise<{
  meetingCountThisMonth: number;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}> => {
  const user = await User.findById(userId)
    .select('meetingCountThisMonth meetingCountResetAt subscriptionTier subscriptionExpiresAt')
    .lean();

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const now = new Date();
  const resetAt = user.meetingCountResetAt;

  // Reset if: never reset, or the reset was in a different month
  if (
    !resetAt ||
    resetAt.getFullYear() < now.getFullYear() ||
    resetAt.getMonth() < now.getMonth()
  ) {
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $set: { meetingCountThisMonth: 0, meetingCountResetAt: now },
      },
      { returnDocument: 'after' }
    )
      .select('meetingCountThisMonth subscriptionTier subscriptionExpiresAt')
      .lean();

    if (!updated) throw new AppError(404, 'User not found after update');

    return {
      meetingCountThisMonth: updated.meetingCountThisMonth,
      subscriptionTier: updated.subscriptionTier,
      subscriptionExpiresAt: updated.subscriptionExpiresAt,
    };
  }

  return {
    meetingCountThisMonth: user.meetingCountThisMonth,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };
};

/**
 * Check if the user can upload another meeting this month.
 * Throws an AppError if the limit is reached.
 */
export const checkMeetingCredits = async (userId: string): Promise<void> => {
  const { meetingCountThisMonth, subscriptionTier, subscriptionExpiresAt } =
    await ensureMeetingCountReset(userId);

  const limit = MONTHLY_MEETING_LIMITS[subscriptionTier] ?? 5;
  const isSubscribed = hasActiveSubscription(subscriptionTier, subscriptionExpiresAt);

  if (!isSubscribed && meetingCountThisMonth >= limit) {
    throw new AppError(
      403,
      `You've used all ${limit} free meetings this month. Upgrade to PRO for unlimited meetings.`,
      'MEETING_LIMIT_REACHED'
    );
  }
};

/**
 * Increment the user's monthly meeting counter after a successful upload.
 */
export const incrementMeetingCount = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $inc: { meetingCountThisMonth: 1 },
  });
};

/**
 * Require an active subscription. Call this at the start of any route handler
 * that should be gated behind a paid tier.
 *
 * Throws an AppError if the user doesn't have an active subscription.
 */
export const requireSubscription = async (userId: string): Promise<void> => {
  const user = await User.findById(userId)
    .select('subscriptionTier subscriptionExpiresAt')
    .lean();

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (!hasActiveSubscription(user.subscriptionTier, user.subscriptionExpiresAt)) {
    throw new AppError(403,
      'A paid subscription is required for this action. Upgrade to PRO or TEAM.'
    );
  }
};
