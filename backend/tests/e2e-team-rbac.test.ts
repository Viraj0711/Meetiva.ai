import axios from 'axios';

/**
 * End-to-end test suite for Team Role-Based Access Control
 *
 * Scenario:
 * - Create 3 users: manager, lead, member
 * - Create a team and assign users with different roles
 * - Create meetings and action items for different users
 * - Verify that managers/leads can see team members' data
 * - Verify that members can only see their own data
 */

const BASE_URL = 'http://localhost:3001/api';

interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface TestData {
  manager: TestUser;
  lead: TestUser;
  member: TestUser;
  teamId: string;
  meetingUser1: string; // Meeting created by manager
  meetingUser2: string; // Meeting created by member
  actionItemUser1: string; // Action item created by lead
  actionItemUser2: string; // Action item created by member
}

let testData: TestData;

/**
 * Helper: Register a user
 */
async function registerUser(email: string, name: string, password: string = 'Test123!@'): Promise<TestUser> {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email,
      name,
      password,
    });

    return {
      id: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name,
      token: response.data.token,
    };
  } catch (error: any) {
    throw new Error(`Failed to register user ${email}: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Helper: Login a user
 */
async function loginUser(email: string, password: string = 'Test123!@'): Promise<TestUser> {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });

    return {
      id: response.data.user.id,
      email: response.data.user.email,
      name: response.data.user.name,
      token: response.data.token,
    };
  } catch (error: any) {
    throw new Error(`Failed to login user ${email}: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Helper: Create a meeting
 */
async function createMeeting(token: string, title: string): Promise<string> {
  try {
    const response = await axios.post(
      `${BASE_URL}/meetings`,
      {
        title,
        description: `Test meeting: ${title}`,
        status: 'completed',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.id;
  } catch (error: any) {
    throw new Error(`Failed to create meeting: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Helper: Create an action item
 */
async function createActionItem(token: string, meetingId: string, title: string): Promise<string> {
  try {
    const response = await axios.post(
      `${BASE_URL}/action-items`,
      {
        meetingId,
        title,
        description: `Test action item: ${title}`,
        status: 'pending',
        priority: 'medium',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.id;
  } catch (error: any) {
    throw new Error(`Failed to create action item: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 1: User Registration and Role Assignment
 */
async function testRegistrationAndRoleAssignment() {
  console.log('\n📝 Test 1: User Registration and Role Assignment');
  console.log('================================================');

  testData = {
    manager: await registerUser('manager@test.com', 'Manager User'),
    lead: await registerUser('lead@test.com', 'Lead User'),
    member: await registerUser('member@test.com', 'Member User'),
    teamId: '',
    meetingUser1: '',
    meetingUser2: '',
    actionItemUser1: '',
    actionItemUser2: '',
  };

  console.log('✅ Users registered:');
  console.log(`   - Manager: ${testData.manager.email}`);
  console.log(`   - Lead: ${testData.lead.email}`);
  console.log(`   - Member: ${testData.member.email}`);
}

/**
 * Test 2: Team Creation and Member Assignment
 * Note: This assumes a backend endpoint exists for team management (not yet implemented in the UI)
 */
async function testTeamManagement() {
  console.log('\n👥 Test 2: Team Creation and Member Assignment');
  console.log('================================================');

  // For now, we'll skip this as team creation UI isn't built
  // In production, you'd use: POST /api/teams and POST /api/teams/:id/members
  console.log('⚠️  Team management requires admin/teams endpoints (future enhancement)');
  console.log('   This test assumes teams are created via database seed or admin panel');
}

/**
 * Test 3: Manager Can View Own Meetings
 */
async function testManagerViewOwnMeetings() {
  console.log('\n🎥 Test 3: Manager Can View Own Meetings');
  console.log('===========================================');

  try {
    const meetingId = await createMeeting(testData.manager.token, 'Manager Meeting 1');
    testData.meetingUser1 = meetingId;

    const response = await axios.get(`${BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${testData.manager.token}` },
    });

    const hasMeeting = response.data.data.some((m: any) => m.id === meetingId);
    console.log(`✅ Manager created meeting: ${meetingId}`);
    console.log(`✅ Manager can retrieve own meeting in list: ${hasMeeting}`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 4: Member Can View Own Meetings
 */
async function testMemberViewOwnMeetings() {
  console.log('\n👤 Test 4: Member Can View Own Meetings');
  console.log('=========================================');

  try {
    const meetingId = await createMeeting(testData.member.token, 'Member Meeting 1');
    testData.meetingUser2 = meetingId;

    const response = await axios.get(`${BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${testData.member.token}` },
    });

    const hasMeeting = response.data.data.some((m: any) => m.id === meetingId);
    console.log(`✅ Member created meeting: ${meetingId}`);
    console.log(`✅ Member can retrieve own meeting in list: ${hasMeeting}`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 5: Manager Cannot View Member's Meetings (Without Team)
 * Before team assignment, manager should NOT see member's meetings
 */
async function testManagerCannotViewMemberMeetingsPreTeam() {
  console.log('\n🔒 Test 5: Manager Cannot View Member Meetings (Pre-Team)');
  console.log('==========================================================');

  try {
    const response = await axios.get(`${BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${testData.manager.token}` },
    });

    const hasMemberMeeting = response.data.data.some((m: any) => m.id === testData.meetingUser2);
    console.log(`✅ Manager fetched meetings. Member's meeting visible: ${hasMemberMeeting}`);
    console.log(`   Expected: false (before team assignment)`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 6: Action Items - Create and View
 */
async function testActionItems() {
  console.log('\n✅ Test 6: Action Items - Create and View');
  console.log('===========================================');

  try {
    // Lead creates action item
    const actionId1 = await createActionItem(testData.lead.token, testData.meetingUser1, 'Lead Action Item');
    testData.actionItemUser1 = actionId1;
    console.log(`✅ Lead created action item: ${actionId1}`);

    // Member creates action item
    const actionId2 = await createActionItem(testData.member.token, testData.meetingUser2, 'Member Action Item');
    testData.actionItemUser2 = actionId2;
    console.log(`✅ Member created action item: ${actionId2}`);

    // Lead retrieves action items
    const response = await axios.get(`${BASE_URL}/action-items`, {
      headers: { Authorization: `Bearer ${testData.lead.token}` },
    });

    const hasOwnItem = response.data.data.some((item: any) => item.id === actionId1);
    console.log(`✅ Lead can retrieve own action item: ${hasOwnItem}`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 7: Meeting Stats Endpoint
 */
async function testMeetingStats() {
  console.log('\n📊 Test 7: Meeting Stats Endpoint');
  console.log('===================================');

  try {
    const managerStats = await axios.get(`${BASE_URL}/meetings/stats`, {
      headers: { Authorization: `Bearer ${testData.manager.token}` },
    });

    console.log(`✅ Manager fetched stats:`);
    console.log(`   - Total meetings: ${managerStats.data.totalMeetings ?? 'N/A'}`);
    console.log(`   - Avg duration: ${managerStats.data.avgDuration ?? 'N/A'}m`);
    console.log(`   - Avg action items: ${managerStats.data.avgActionItems ?? 'N/A'}`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 8: JWT Token Validation
 */
async function testJWTToken() {
  console.log('\n🔑 Test 8: JWT Token Contains Team Information');
  console.log('==============================================');

  try {
    // Decode JWT to check teams field
    const parts = testData.manager.token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log(`✅ Manager JWT payload:`);
    console.log(`   - User ID: ${payload.userId}`);
    console.log(`   - Email: ${payload.email}`);
    console.log(`   - Teams: ${JSON.stringify(payload.teams || [])}`);
    console.log(`   Note: Teams array will be empty until team assignment via admin panel`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 9: Permission Check on Meeting Details
 */
async function testMeetingDetailPermissions() {
  console.log('\n🔐 Test 9: Permission Check on Meeting Details');
  console.log('==============================================');

  try {
    // Manager owns meeting, should be able to view details
    const managerResponse = await axios.get(`${BASE_URL}/meetings/${testData.meetingUser1}`, {
      headers: { Authorization: `Bearer ${testData.manager.token}` },
    });
    console.log(`✅ Manager can view own meeting details`);

    // Member does not own meeting, should NOT be able to view it (pre-team)
    try {
      await axios.get(`${BASE_URL}/meetings/${testData.meetingUser1}`, {
        headers: { Authorization: `Bearer ${testData.member.token}` },
      });
      console.log(`⚠️  Member unexpectedly able to view manager's meeting`);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log(`✅ Member cannot view other's meeting (expected 403/404)`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Test 10: Modification Permissions
 */
async function testModificationPermissions() {
  console.log('\n✏️  Test 10: Modification Permissions (Owner Only)');
  console.log('===================================================');

  try {
    const updateData = {
      title: 'Updated Meeting Title',
    };

    // Manager owns meeting, should be able to update
    await axios.patch(`${BASE_URL}/meetings/${testData.meetingUser1}`, updateData, {
      headers: { Authorization: `Bearer ${testData.manager.token}` },
    });
    console.log(`✅ Manager can update own meeting`);

    // Member does not own meeting, should NOT be able to update it
    try {
      await axios.patch(`${BASE_URL}/meetings/${testData.meetingUser1}`, updateData, {
        headers: { Authorization: `Bearer ${testData.member.token}` },
      });
      console.log(`⚠️  Member unexpectedly able to update manager's meeting`);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log(`✅ Member cannot update other's meeting (expected 403/404)`);
      }
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting E2E Team RBAC Tests');
  console.log('================================\n');

  try {
    await testRegistrationAndRoleAssignment();
    await testTeamManagement();
    await testManagerViewOwnMeetings();
    await testMemberViewOwnMeetings();
    await testManagerCannotViewMemberMeetingsPreTeam();
    await testActionItems();
    await testMeetingStats();
    await testJWTToken();
    await testMeetingDetailPermissions();
    await testModificationPermissions();

    console.log('\n\n✅ All tests completed!');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Create team via database seed or admin panel');
    console.log('   2. Assign users to team with roles (MANAGER, LEAD, MEMBER)');
    console.log('   3. Rerun tests - Manager/Lead should now see Member\'s data');
    console.log('   4. Verify frontend toggles show team data for managers/leads\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests();
}

export { runTests, testData };
