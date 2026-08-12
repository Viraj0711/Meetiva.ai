import User from '../models/User';
import Organization from '../models/Organization';
import RefreshToken from '../models/RefreshToken';
import GoogleCalendarAuth from '../models/GoogleCalendarAuth';
import TeamMember from '../models/TeamMember';
import TeamInvitation from '../models/TeamInvitation';
import Notification from '../models/Notification';
import Meeting from '../models/Meeting';
import ActionItem from '../models/ActionItem';
import { createLogger } from '../lib/logger';

const log = createLogger('meetiva:userRemoval');

/**
 * The ONLY sanctioned way to remove a user.
 * Handles: soft-delete, seat decrement, token revocation, cleanup.
 * Do NOT call User.deleteOne/findByIdAndDelete directly — always use this.
 */
export async function removeUser(userId: string): Promise<void> {
  const user = await User.findById(userId)
    .select('organizationId accountType isRemoved')
    .lean();

  if (!user) {
    log.warn('removeUser called for non-existent user', { userId });
    return;
  }

  if (user.isRemoved) {
    log.warn('removeUser called for already-removed user', { userId });
    return;
  }

  // 1. Soft-delete + token revocation
  await User.findByIdAndUpdate(userId, {
    isRemoved: true,
    isActive: false,
    $inc: { tokenVersion: 1 },
  });

  // 2. Free seat on organization (only for corporate users)
  if (user.organizationId && user.accountType === 'corporate') {
    await Organization.findByIdAndUpdate(user.organizationId, {
      $inc: { seatsUsed: -1 },
    });
    log.info('Seat freed', { orgId: user.organizationId.toString(), userId });
  }

  // 3. Delete refresh tokens (all sessions invalidated)
  await RefreshToken.deleteMany({ userId: user._id });

  // 4. Delete Google Calendar OAuth tokens
  await GoogleCalendarAuth.deleteOne({ userId: user._id });

  // 5. Remove team memberships
  await TeamMember.deleteMany({ userId: user._id });

  // 6. Delete pending invitations sent by this user
  await TeamInvitation.deleteMany({ invitedBy: user._id });

  // 7. Delete notifications (user-specific)
  await Notification.deleteMany({ userId: user._id });

  // 8. Content (meetings, tasks, chat messages) stays intact for disposition
  //    Team Leader/Manager handles reassignment via disposition endpoints

  log.info('User removed', { userId, orgId: user.organizationId?.toString() });
}

/**
 * Get disposition content for a removed user.
 * Returns meetings and tasks owned by the removed user.
 */
export async function getDisposedContent(userId: string) {
  const [meetings, tasks] = await Promise.all([
    Meeting.find({ userId })
      .select('title status createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    ActionItem.find({ userId })
      .select('title status priority createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return { meetings, tasks };
}
