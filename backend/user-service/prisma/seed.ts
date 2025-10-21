import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('👤 Admin user already exists, skipping...');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('password', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password_hash: hashedPassword,
      user_type: UserType.ADMIN,
    }
  });

  console.log('✅ Admin user created successfully:', {
    id: adminUser.id,
    username: adminUser.username,
    user_type: adminUser.user_type,
    created_at: adminUser.created_at
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
