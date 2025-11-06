import { getPrismaClient } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = getPrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Read existing users from JSON file
    const usersFilePath = path.join(process.cwd(), 'models', 'users.json');
    
    let existingUsers = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      existingUsers = JSON.parse(data);
      console.log(`📄 Found ${existingUsers.length} users in JSON file`);
    } catch (error) {
      console.log('📄 No existing users.json file found, starting with empty database');
      return;
    }

    // Check if users already exist in database
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`⚠️  Database already contains ${userCount} users. Skipping seed.`);
      return;
    }

    // Migrate users to database
    for (const user of existingUsers) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email.toLowerCase(),
            password: user.password,
            isEmailVerified: user.isEmailVerified || false,
            signupOTP: user.signupOTP || null,
            passwordResetOTP: user.passwordResetOTP || null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }

    const finalCount = await prisma.user.count();
    console.log(`🎉 Database seeding completed! Total users: ${finalCount}`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
