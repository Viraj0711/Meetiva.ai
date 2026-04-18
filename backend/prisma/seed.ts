import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to create test data for team RBAC testing
 * Creates:
 * - 3 test users (manager, lead, member)
 * - 1 team
 * - Assigns users to team with different roles
 * - Creates some test meetings and action items
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...');
  try {
    await prisma.teamMember.deleteMany({
      where: {
        user: {
          email: {
            in: ['manager@test.com', 'lead@test.com', 'member@test.com'],
          },
        },
      },
    });
  } catch (error: any) {
    console.warn('⚠️  Warning cleaning team members:', error.message);
  }

  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['manager@test.com', 'lead@test.com', 'member@test.com'],
        },
      },
    });
  } catch (error: any) {
    console.warn('⚠️  Warning cleaning users:', error.message);
  }

  try {
    await prisma.team.deleteMany({
      where: {
        name: 'Test Team',
      },
    });
  } catch (error: any) {
    console.warn('⚠️  Warning cleaning teams:', error.message);
  }

  // Create test users
  console.log('👥 Creating test users...');
  const bcrypt = require('bcryptjs');
  const password = await bcrypt.hash('Test123!@', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      name: 'Test Manager',
      hashedPassword: password,
    },
  });

  const lead = await prisma.user.upsert({
    where: { email: 'lead@test.com' },
    update: {},
    create: {
      email: 'lead@test.com',
      name: 'Test Lead',
      hashedPassword: password,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@test.com' },
    update: {},
    create: {
      email: 'member@test.com',
      name: 'Test Member',
      hashedPassword: password,
    },
  });

  console.log(`✅ Created users:`);
  console.log(`   - Manager (${manager.id}): manager@test.com`);
  console.log(`   - Lead (${lead.id}): lead@test.com`);
  console.log(`   - Member (${member.id}): member@test.com\n`);

  // Create team
  console.log('🏢 Creating team...');
  let team = await prisma.team.findFirst({
    where: { name: 'Test Team' },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'Test Team',
        description: 'Team for RBAC testing',
      },
    });
  }
  console.log(`✅ Created team: ${team.name} (${team.id})\n`);

  // Assign users to team with different roles
  console.log('🎯 Assigning users to team with roles...');
  const managerMember = await prisma.teamMember.upsert({
    where: {
      userId_teamId: {
        userId: manager.id,
        teamId: team.id,
      },
    },
    update: { role: 'MANAGER' },
    create: {
      userId: manager.id,
      teamId: team.id,
      role: 'MANAGER',
    },
  });

  const leadMember = await prisma.teamMember.upsert({
    where: {
      userId_teamId: {
        userId: lead.id,
        teamId: team.id,
      },
    },
    update: { role: 'LEAD' },
    create: {
      userId: lead.id,
      teamId: team.id,
      role: 'LEAD',
    },
  });

  const memberMember = await prisma.teamMember.upsert({
    where: {
      userId_teamId: {
        userId: member.id,
        teamId: team.id,
      },
    },
    update: { role: 'MEMBER' },
    create: {
      userId: member.id,
      teamId: team.id,
      role: 'MEMBER',
    },
  });

  console.log(`✅ Team assignments:`);
  console.log(`   - ${manager.name}: MANAGER`);
  console.log(`   - ${lead.name}: LEAD`);
  console.log(`   - ${member.name}: MEMBER\n`);

  // Create sample meetings
  console.log('🎥 Creating sample meetings...');
  const managerMeeting = await prisma.meeting.create({
    data: {
      title: 'Q1 Planning Session',
      description: 'Created by manager',
      status: 'completed',
      userId: manager.id,
      participants: JSON.stringify([manager.name, lead.name, member.name]),
      duration: 3600,
    },
  });

  const leadMeeting = await prisma.meeting.create({
    data: {
      title: 'Team Standup',
      description: 'Created by lead',
      status: 'completed',
      userId: lead.id,
      participants: JSON.stringify([lead.name, member.name]),
      duration: 1800,
    },
  });

  const memberMeeting = await prisma.meeting.create({
    data: {
      title: '1-on-1 Sync',
      description: 'Created by member',
      status: 'completed',
      userId: member.id,
      participants: JSON.stringify([member.name, lead.name]),
      duration: 900,
    },
  });

  console.log(`✅ Created meetings:`);
  console.log(`   - Manager: ${managerMeeting.title}`);
  console.log(`   - Lead: ${leadMeeting.title}`);
  console.log(`   - Member: ${memberMeeting.title}\n`);

  // Create sample action items
  console.log('✅ Creating sample action items...');
  const actionItem1 = await prisma.actionItem.create({
    data: {
      meetingId: managerMeeting.id,
      userId: manager.id,
      title: 'Review budget proposal',
      description: 'Created by manager',
      status: 'pending',
      priority: 'high',
    },
  });

  const actionItem2 = await prisma.actionItem.create({
    data: {
      meetingId: leadMeeting.id,
      userId: lead.id,
      title: 'Update documentation',
      description: 'Created by lead',
      status: 'in_progress',
      priority: 'medium',
    },
  });

  const actionItem3 = await prisma.actionItem.create({
    data: {
      meetingId: memberMeeting.id,
      userId: member.id,
      title: 'Complete task',
      description: 'Created by member',
      status: 'pending',
      priority: 'medium',
    },
  });

  console.log(`✅ Created action items:`);
  console.log(`   - ${actionItem1.title} (pending)`);
  console.log(`   - ${actionItem2.title} (in_progress)`);
  console.log(`   - ${actionItem3.title} (pending)\n`);

  console.log('✅ Seed completed!\n');
  console.log('🧪 Test Data Summary:');
  console.log('====================');
  console.log(`Manager Email: manager@test.com`);
  console.log(`Lead Email: lead@test.com`);
  console.log(`Member Email: member@test.com`);
  console.log(`Password: Test123!@`);
  console.log(`Team: ${team.name}`);
  console.log(`\n📋 RBAC Test Expectations:`);
  console.log(`  ✓ Manager should see: all 3 meetings + all 3 action items (team MANAGER role)`);
  console.log(`  ✓ Lead should see: all 3 meetings + all 3 action items (team LEAD role)`);
  console.log(`  ✓ Member should see: only own meeting + own action item (team MEMBER role)`);
  console.log(`\n📝 Next: Run the E2E test suite to verify permissions\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
