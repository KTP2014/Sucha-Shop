import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database users...');

  // 1. Create or Update Owner
  const owner = await prisma.user.upsert({
    where: { pin: '9999' },
    update: {
      name: 'Owner',
      role: 'OWNER',
      isActive: true,
    },
    create: {
      name: 'Owner',
      pin: '9999',
      role: 'OWNER',
      isActive: true,
    },
  });
  console.log(`User seeded: ${owner.name} (Role: ${owner.role})`);

  // 2. Create or Update Staff
  const staff = await prisma.user.upsert({
    where: { pin: '1234' },
    update: {
      name: 'Staff',
      role: 'STAFF',
      isActive: true,
    },
    create: {
      name: 'Staff',
      pin: '1234',
      role: 'STAFF',
      isActive: true,
    },
  });
  console.log(`User seeded: ${staff.name} (Role: ${staff.role})`);

  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
