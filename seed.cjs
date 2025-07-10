const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const users = [
    {
      email: 'admin@test.com',
      fullName: 'Admin User',
      role: 'admin',
      password: 'admin123',
    },
    {
      email: 'user@test.com',
      fullName: 'Regular User',
      role: 'user',
      password: 'user123',
    },
    {
      email: 'media@test.com',
      fullName: 'Media User',
      role: 'media',
      password: 'media123',
    },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          password: hashedPassword,
          balance: 0,
        },
      });
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`⏭️ User already exists: ${userData.email}`);
    }
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@test.com / admin123');
  console.log('User: user@test.com / user123');
  console.log('Media: media@test.com / media123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 