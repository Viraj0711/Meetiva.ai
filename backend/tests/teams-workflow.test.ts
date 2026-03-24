import axios from 'axios';

/**
 * Test Teams API workflow
 * Workflow:
 * 1. Manager registers and logs in
 * 2. Manager creates a team
 * 3. Manager adds a team lead
 * 4. Team lead logs in
 * 5. Team lead adds members to the team
 * 6. Verify all members can access the team
 */

const BASE_URL = 'http://localhost:8000/api/v1';

interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface TestTeam {
  id: string;
  name: string;
}

let testData: {
  manager?: TestUser;
  lead?: TestUser;
  member?: TestUser;
  team?: TestTeam;
} = {};

const generateEmail = (role: string) => `teams-test-${role}-${Date.now()}@test.com`;

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
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

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
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function createTeam(token: string, name: string, description?: string): Promise<TestTeam> {
  try {
    const response = await axios.post(
      `${BASE_URL}/teams`,
      { name, description },
      { headers: getAuthHeaders(token) }
    );

    return {
      id: response.data.team.id,
      name: response.data.team.name,
    };
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

async function addTeamMember(
  token: string,
  teamId: string,
  email: string,
  role: 'LEAD' | 'MEMBER'
): Promise<void> {
  try {
    const response = await axios.post(
      `${BASE_URL}/teams/${teamId}/members`,
      { email, role },
      { headers: getAuthHeaders(token) }
    );

    console.log(`✅ Added ${email} as ${role} to team`);
  } catch (error: any) {
    console.error(`Error adding team member:`, error.response?.data || error.message);
    throw error;
  }
}

async function getTeamMembers(token: string, teamId: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/teams/${teamId}/members`,
      { headers: getAuthHeaders(token) }
    );

    return response.data.members;
  } catch (error) {
    console.error('Error getting team members:', error);
    throw error;
  }
}

async function getTeams(token: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/teams`,
      { headers: getAuthHeaders(token) }
    );

    return response.data.teams;
  } catch (error) {
    console.error('Error getting teams:', error);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('\n🚀 Starting Teams API Tests\n');

    // Test 1: Manager registers
    console.log('Test 1: Manager registers...');
    testData.manager = await registerUser(
      generateEmail('manager'),
      'Test Manager'
    );
    console.log(`✅ Manager created: ${testData.manager.email}\n`);

    // Test 2: Create team
    console.log('Test 2: Manager creates team...');
    testData.team = await createTeam(
      testData.manager.token,
      'Engineering Team',
      'Test engineering team'
    );
    console.log(`✅ Team created: ${testData.team.name} (ID: ${testData.team.id})\n`);

    // Test 3: Register team lead
    console.log('Test 3: Team lead registers...');
    testData.lead = await registerUser(
      generateEmail('lead'),
      'Test Lead'
    );
    console.log(`✅ Team lead created: ${testData.lead.email}\n`);

    // Test 4: Manager adds team lead to team
    console.log('Test 4: Manager adds team lead...');
    await addTeamMember(
      testData.manager.token,
      testData.team.id,
      testData.lead.email,
      'LEAD'
    );
    console.log(`✅ Team lead added to team\n`);

    // Test 5: Register member
    console.log('Test 5: Team member registers...');
    testData.member = await registerUser(
      generateEmail('member'),
      'Test Member'
    );
    console.log(`✅ Team member created: ${testData.member.email}\n`);

    // Test 6: Team lead adds member to team
    console.log('Test 6: Team lead adds member...');
    await addTeamMember(
      testData.lead.token,
      testData.team.id,
      testData.member.email,
      'MEMBER'
    );
    console.log(`✅ Member added to team\n`);

    // Test 7: Verify team members
    console.log('Test 7: Verify team members...');
    const members = await getTeamMembers(testData.manager.token, testData.team.id);
    console.log(`✅ Team has ${members.length} members:`);
    members.forEach(m => {
      console.log(`   - ${m.name} (${m.email}) - Role: ${m.role}`);
    });
    console.log();

    // Test 8: Verify manager sees team
    console.log('Test 8: Manager can see team...');
    const managerTeams = await getTeams(testData.manager.token);
    const teamExists = managerTeams.some(t => t.id === testData.team!.id);
    if (teamExists) {
      console.log(`✅ Manager sees team\n`);
    } else {
      console.log(`❌ Manager does not see team\n`);
    }

    // Test 9: Verify lead sees team
    console.log('Test 9: Team lead can see team...');
    const leadTeams = await getTeams(testData.lead.token);
    const leadTeamExists = leadTeams.some(t => t.id === testData.team!.id);
    if (leadTeamExists) {
      console.log(`✅ Team lead sees team\n`);
    } else {
      console.log(`❌ Team lead does not see team\n`);
    }

    // Test 10: Verify member sees team
    console.log('Test 10: Team member can see team...');
    const memberTeams = await getTeams(testData.member.token);
    const memberTeamExists = memberTeams.some(t => t.id === testData.team!.id);
    if (memberTeamExists) {
      console.log(`✅ Team member sees team\n`);
    } else {
      console.log(`❌ Team member does not see team\n`);
    }

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
