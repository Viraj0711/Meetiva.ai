/**
 * End-to-end test for Mongoose models and service-layer functions.
 *
 * Verifies the Prisma → Mongoose migration by testing:
 *   - Model creation & querying (User, Meeting, Team, Task, etc.)
 *   - ObjectId references and populate()
 *   - Cascade deletes (Meeting → Transcript, Team → TeamMember)
 *   - Subscription service (checkMeetingCredits, incrementMeetingCount)
 *   - Meeting status sync (syncMeetingStatusFromTasks)
 *   - Unique constraints and validation
 *
 * Run with: npx tsx src/tests/mongoose-models.test.ts
 *
 * Requires ~1.5 GB free disk for the mongodb-memory-server binary download
 * on first run. Subsequent runs use the cached binary.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// ── Models ──────────────────────────────────────────────────────────────────
import User from '../models/User';
import Meeting from '../models/Meeting';
import MeetingSummary from '../models/MeetingSummary';
import Transcript from '../models/Transcript';
import Task from '../models/ActionItem';
import Team from '../models/Team';
import TeamMember from '../models/TeamMember';
import TeamInvitation from '../models/TeamInvitation';
import TeamChatMessage from '../models/TeamChatMessage';
import Notification from '../models/Notification';
import RefreshToken from '../models/RefreshToken';
import GoogleCalendarAuth from '../models/GoogleCalendarAuth';

// ── Services ────────────────────────────────────────────────────────────────
import {
  checkMeetingCredits,
  incrementMeetingCount,
  hasActiveSubscription,
  ensureMeetingCountReset,
} from '../lib/subscription';
import { syncMeetingStatusFromTasks } from '../services/meetingStatus';

// ── Test helpers ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let mongod: MongoMemoryServer | null = null;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    process.stdout.write(`  ✅ ${label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ❌ ${label}\n`);
  }
}

// ── Setup / Teardown ────────────────────────────────────────────────────────

async function setup(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  // Ensure unique indexes (email, inviteCode, tokenHash, composite) are built
  // before tests run — otherwise duplicate-key tests race the async index
  // build and flakily pass/fail.
  await mongoose.connection.syncIndexes();
}

async function teardown(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  await setup();
  process.stdout.write('\n🧪 Mongoose Models — Migration Verification\n\n');

  // ─── 1. User CRUD ─────────────────────────────────────────────────────────

  {
    process.stdout.write('Test 1: User CRUD\n');

    const user = await User.create({
      email: 'alice@test.com',
      name: 'Alice',
      hashedPassword: 'hashed_pw_123',
      subscriptionTier: 'FREE',
    });

    assert(user.email === 'alice@test.com', 'User created with correct email');
    assert(user.name === 'Alice', 'User created with correct name');
    assert(user.subscriptionTier === 'FREE', 'Default subscription tier is FREE');
    assert(user.isActive === true, 'User is active by default');
    assert(user._id.toString().length === 24, 'User _id is a 24-char ObjectId');

    // Read back
    const found = await User.findById(user._id).lean();
    assert(found !== null, 'User found by _id');
    assert(found!.email === 'alice@test.com', 'Found user has correct email');

    // Unique email constraint
    try {
      await User.create({ email: 'alice@test.com', name: 'Duplicate', hashedPassword: 'pw' });
      assert(false, 'Duplicate email should throw');
    } catch (err: any) {
      assert(err.code === 11000, `Duplicate email throws MongoServerError 11000 (got ${err.code})`);
    }

    // Update
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: { name: 'Alice Updated' } },    { returnDocument: 'after' }
    ).lean();

    assert(updated!.name === 'Alice Updated', 'User name updated successfully');

    // Subscription helpers
    assert(hasActiveSubscription('FREE') === false, 'FREE tier is not active subscription');
    assert(hasActiveSubscription('TEAM') === true, 'TEAM tier is active subscription');
    assert(
      hasActiveSubscription('TEAM', new Date(Date.now() - 86400000)) === false,
      'TEAM tier with expired date is not active'
    );

    await User.findByIdAndDelete(user._id);
    const deleted = await User.findById(user._id).lean();
    assert(deleted === null, 'User deleted successfully');
  }

   // ─── 2. Meeting + Transcript + Task cascade delete ───────────────────

  {
    process.stdout.write('\nTest 2: Meeting cascade delete\n');

    const user = await User.create({
      email: 'bob@test.com',
      name: 'Bob',
      hashedPassword: 'pw',
      subscriptionTier: 'FREE',
    });

    const meeting = await Meeting.create({
      title: 'Sprint Planning',
      userId: user._id,
      status: 'processing',
      participants: ['Alice', 'Bob'],
      processingProgress: 50,
    });

    assert(meeting.title === 'Sprint Planning', 'Meeting created');
    assert(meeting.userId.toString() === user._id.toString(), 'Meeting linked to user');

    // Create related data
    await Transcript.create({
      meetingId: meeting._id,
      fullText: 'This is the transcript of the meeting.',
      segments: [],
    });

    await MeetingSummary.create({
      meetingId: meeting._id,
      executiveSummary: 'Summary of the meeting',
      keyPoints: ['Point 1', 'Point 2'],
      decisions: ['Decision 1'],
      openQuestions: [],
      sentiment: 'positive',
    });

    await Task.create({
      meetingId: meeting._id,
      userId: user._id,
      title: 'Action 1',
      status: 'pending',
      priority: 'high',
    });

    // Verify cascade: meeting exists
    let foundMeeting = await Meeting.findById(meeting._id).lean();
    assert(foundMeeting !== null, 'Meeting exists before delete');

    // Delete meeting (triggers cascade)
    await Meeting.findByIdAndDelete(meeting._id);

    // Verify cascade: meeting, transcript, summary, actions all gone
    const [afterMeeting, afterTranscript, afterSummary, afterActions] = await Promise.all([
      Meeting.findById(meeting._id).lean(),
      Transcript.findOne({ meetingId: meeting._id }).lean(),
      MeetingSummary.findOne({ meetingId: meeting._id }).lean(),
      Task.countDocuments({ meetingId: meeting._id }),
    ]);

    assert(afterMeeting === null, 'Meeting cascade: meeting deleted');
    assert(afterTranscript === null, 'Meeting cascade: transcript deleted');
    assert(afterSummary === null, 'Meeting cascade: summary deleted');
    assert(afterActions === 0, 'Meeting cascade: action items deleted');

    await User.findByIdAndDelete(user._id);
  }

  // ─── 3. Team + TeamMember + TeamInvitation cascade delete ─────────────────

  {
    process.stdout.write('\nTest 3: Team cascade delete\n');

    const user = await User.create({
      email: 'carol@test.com',
      name: 'Carol',
      hashedPassword: 'pw',
      subscriptionTier: 'TEAM',
    });

    const team = await Team.create({
      name: 'Engineering',
      description: 'Engineering team',
      inviteCode: 'eng-team-code',
    });

    assert(team.inviteCode === 'eng-team-code', 'Team created with invite code');

    // Add team members
    await TeamMember.create({
      userId: user._id,
      teamId: team._id,
      role: 'MANAGER',
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });

    // Create invitation
    await TeamInvitation.create({
      email: 'newmember@test.com',
      teamId: team._id,
      role: 'MEMBER',
      invitedBy: user._id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000),
    });

    // Delete team (triggers cascade)
    await Team.findByIdAndDelete(team._id);

    const [afterMembers, afterInvitations, afterTeam] = await Promise.all([
      TeamMember.countDocuments({ teamId: team._id }),
      TeamInvitation.countDocuments({ teamId: team._id }),
      Team.findById(team._id).lean(),
    ]);

    assert(afterTeam === null, 'Team cascade: team deleted');
    assert(afterMembers === 0, 'Team cascade: team members deleted');
    assert(afterInvitations === 0, 'Team cascade: invitations deleted');

    await User.findByIdAndDelete(user._id);
  }

  // ─── 4. subscription service ───────────────────────────────────────────────

  {
    process.stdout.write('\nTest 4: Subscription service\n');

    const user = await User.create({
      email: 'dave@test.com',
      name: 'Dave',
      hashedPassword: 'pw',
      subscriptionTier: 'FREE',
      meetingCountThisMonth: 0,
    });

    // FREE tier can upload up to 5 meetings
    await checkMeetingCredits(user._id.toString());
    assert(true, 'checkMeetingCredits passes for FREE with 0 meetings');

    await incrementMeetingCount(user._id.toString());
    const afterInc = await User.findById(user._id).lean();
    assert(afterInc!.meetingCountThisMonth === 1, 'incrementMeetingCount increases counter');

    // Set to 5 meetings (limit) and verify checkMeetingCredits throws
    await User.findByIdAndUpdate(user._id, { $set: { meetingCountThisMonth: 5 } });

    try {
      await checkMeetingCredits(user._id.toString());
      assert(false, 'checkMeetingCredits should throw when FREE limit reached');
    } catch (err: any) {
      assert(err.statusCode === 403, `Throws 403 when limit reached (got ${err.statusCode})`);
      assert(err.code === 'MEETING_LIMIT_REACHED', 'Error code is MEETING_LIMIT_REACHED');
    }

    // TEAM tier should not be limited
    await User.findByIdAndUpdate(user._id, {
      $set: {
      subscriptionTier: 'TEAM',
        subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000),
        meetingCountThisMonth: 100,
      },
    });
    await checkMeetingCredits(user._id.toString());
    assert(true, 'PRO tier passes checkMeetingCredits even with 100 meetings');

    // ensureMeetingCountReset resets counter when month changes
    await User.findByIdAndUpdate(user._id, {
      $set: {
        meetingCountThisMonth: 3,
        meetingCountResetAt: new Date(Date.now() - 40 * 86400000), // 40 days ago
      },
    });
    const reset = await ensureMeetingCountReset(user._id.toString());
    assert(reset.meetingCountThisMonth === 0, 'ensureMeetingCountReset resets counter');

    await User.findByIdAndDelete(user._id);
  }

  // ─── 5. meetingStatus service ──────────────────────────────────────────────

  {
    process.stdout.write('\nTest 5: Meeting status sync\n');

    const user = await User.create({
      email: 'eve@test.com',
      name: 'Eve',
      hashedPassword: 'pw',
    });

    const meeting = await Meeting.create({
      title: 'Status Sync Test',
      userId: user._id,
      status: 'pending',
    });

    // Create action items - only completed ones
    await Task.create({
      meetingId: meeting._id,
      userId: user._id,
      title: 'Done task',
      status: 'completed',
    });
    await Task.create({
      meetingId: meeting._id,
      userId: user._id,
      title: 'Another done task',
      status: 'completed',
    });

    // Sync: all action items completed → meeting should be 'completed'
    await syncMeetingStatusFromTasks(meeting._id.toString());
    const synced = await Meeting.findById(meeting._id).lean();
    assert(synced!.status === 'completed', 'Meeting marked completed when all actions done');
    assert(synced!.completedAt !== null, 'completedAt set when meeting completed');

    // Add an incomplete action item → meeting should revert to 'pending'
    await Task.create({
      meetingId: meeting._id,
      userId: user._id,
      title: 'Incomplete task',
      status: 'in_progress',
    });

    await syncMeetingStatusFromTasks(meeting._id.toString());
    const reverted = await Meeting.findById(meeting._id).lean();
    assert(reverted!.status === 'pending', 'Meeting reverted to pending when incomplete action exists');
    assert(reverted!.completedAt === null, 'completedAt cleared when meeting reverted');

    // Non-existent meeting should not throw
    const fakeId = new mongoose.Types.ObjectId();
    await syncMeetingStatusFromTasks(fakeId.toString());
    assert(true, 'syncMeetingStatusFromTasks handles non-existent meeting gracefully');

    await Task.deleteMany({ meetingId: meeting._id });
    await Meeting.findByIdAndDelete(meeting._id);
    await User.findByIdAndDelete(user._id);
  }

  // ─── 6. RefreshToken TTL ───────────────────────────────────────────────────

  {
    process.stdout.write('\nTest 6: RefreshToken creation\n');

    const user = await User.create({
      email: 'frank@test.com',
      name: 'Frank',
      hashedPassword: 'pw',
    });

    const token = await RefreshToken.create({
      userId: user._id,
      tokenHash: 'abc123hash',
      expiresAt: new Date(Date.now() + 86400000),
    });

    assert(token.tokenHash === 'abc123hash', 'RefreshToken created');
    assert(token.userId.toString() === user._id.toString(), 'RefreshToken linked to user');

    // Find by tokenHash (unique index)
    const found = await RefreshToken.findOne({ tokenHash: 'abc123hash' }).lean();
    assert(found !== null, 'RefreshToken found by tokenHash');
    assert(found!.userId.toString() === user._id.toString(), 'Found token has correct userId');

    // Delete expired token
    await RefreshToken.deleteMany({ userId: user._id });
    const afterDelete = await RefreshToken.countDocuments({ userId: user._id });
    assert(afterDelete === 0, 'RefreshToken deleted');

    await User.findByIdAndDelete(user._id);
  }

  // ─── 7. Notification + GoogleCalendarAuth ──────────────────────────────────

  {
    process.stdout.write('\nTest 7: Notification and CalendarAuth\n');

    const user = await User.create({
      email: 'grace@test.com',
      name: 'Grace',
      hashedPassword: 'pw',
    });

    // Create notification
    const notif = await Notification.create({
      userId: user._id,
      type: 'SYSTEM',
      title: 'Welcome',
      message: 'Welcome to Meetiva!',
      channel: 'in_app',
    });

    assert(notif.title === 'Welcome', 'Notification created');
    assert(notif.isRead === false, 'Notification defaults to unread');

    // Mark as read
    const read = await Notification.findByIdAndUpdate(
      notif._id,
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' }
    ).lean();
    assert(read!.isRead === true, 'Notification marked as read');

    // GoogleCalendarAuth
    const calAuth = await GoogleCalendarAuth.create({
      userId: user._id,
      encryptedAccessToken: 'encrypted_token_123',
      encryptedRefreshToken: 'encrypted_refresh_456',
      tokenType: 'Bearer',
      integrationType: 'google-calendar',
    });

    assert(calAuth.encryptedAccessToken === 'encrypted_token_123', 'GoogleCalendarAuth created');
    assert(calAuth.userId.toString() === user._id.toString(), 'CalendarAuth linked to user');
    assert(calAuth.integrationType === 'google-calendar', 'CalendarAuth has expected integration type');

    await Notification.findByIdAndDelete(notif._id);
    await GoogleCalendarAuth.findByIdAndDelete(calAuth._id);
    await User.findByIdAndDelete(user._id);
  }

  // ─── 8. ObjectId validation ────────────────────────────────────────────────

  {
    process.stdout.write('\nTest 8: ObjectId validation\n');

    assert(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd799439011') === true, '24-char hex is valid ObjectId');
    assert(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd79943901z') === false, 'Invalid hex char rejected');
    assert(mongoose.Types.ObjectId.isValid('short') === false, 'Short string rejected');
    assert(mongoose.Types.ObjectId.isValid('550e8400-e29b-41d4-a716-446655440000') === false, 'UUID format rejected');
    assert(mongoose.Types.ObjectId.isValid('') === false, 'Empty string rejected');
  }

  // ─── 9. TeamChatMessage with populate ──────────────────────────────────────

  {
    process.stdout.write('\nTest 9: TeamChatMessage with populate\n');

    const user = await User.create({
      email: 'heidi@test.com',
      name: 'Heidi',
      hashedPassword: 'pw',
    });

    const team = await Team.create({
      name: 'Chat Team',
      inviteCode: 'chat-team-code',
    });

    const msg = await TeamChatMessage.create({
      teamId: team._id,
      userId: user._id,
      message: 'Hello team!',
    });

    assert(msg.message === 'Hello team!', 'TeamChatMessage created');

    // Populate
    const populated = await TeamChatMessage.findById(msg._id)
      .populate('userId', 'name email')
      .lean() as any;
    assert(populated.userId.name === 'Heidi', 'TeamChatMessage populated with user name');
    assert(populated.userId.email === 'heidi@test.com', 'TeamChatMessage populated with user email');

    await TeamChatMessage.findByIdAndDelete(msg._id);
    await Team.findByIdAndDelete(team._id);
    await User.findByIdAndDelete(user._id);
  }

  // ─── 10. TeamMember composite unique constraint ────────────────────────────

  {
    process.stdout.write('\nTest 10: TeamMember composite unique\n');

    const user = await User.create({
      email: 'ivan@test.com',
      name: 'Ivan',
      hashedPassword: 'pw',
    });

    const team = await Team.create({
      name: 'Unique Test',
      inviteCode: 'unique-team-code',
    });

    await TeamMember.create({
      userId: user._id,
      teamId: team._id,
      role: 'MEMBER',
    });

    // Duplicate userId + teamId should throw
    try {
      await TeamMember.create({
        userId: user._id,
        teamId: team._id,
        role: 'LEAD',
      });
      assert(false, 'Duplicate userId+teamId should throw');
    } catch (err: any) {
      assert(err.code === 11000, `Duplicate userId+teamId throws MongoServerError 11000 (got ${err.code})`);
    }

    await TeamMember.deleteMany({ teamId: team._id });
    await Team.findByIdAndDelete(team._id);
    await User.findByIdAndDelete(user._id);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  process.stdout.write('\n');
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  process.stdout.write(`  Passed: ${passed}   Failed: ${failed}\n`);
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`);

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Test runner crashed:', err);
    try {
      await teardown();
    } catch {}
    process.exit(1);
  });
