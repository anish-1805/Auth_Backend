import { PrismaClient } from '@prisma/client';
import { DatabaseHealthCheck } from '../types/index.js';

// Global variable to store the Prisma client instance
let prisma: PrismaClient | undefined;

// Database configuration with connection pooling
const createPrismaClient = (): PrismaClient => {
  // Build DATABASE_URL with connection pooling parameters
  const databaseUrl = new URL(process.env.DATABASE_URL!);
  
  // Add connection pooling parameters to the URL
  databaseUrl.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '10');
  databaseUrl.searchParams.set('pool_timeout', process.env.DB_POOL_TIMEOUT || '20');
  databaseUrl.searchParams.set('connect_timeout', process.env.DB_CONNECT_TIMEOUT || '60');
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl.toString(),
      },
    },
    log: ['error'], // Only log errors, no queries
    
    // Additional Prisma configuration
    errorFormat: 'pretty',
    
    // Transaction options
    transactionOptions: {
      maxWait: parseInt(process.env.DB_TRANSACTION_MAX_WAIT || '5000'), // 5 seconds
      timeout: parseInt(process.env.DB_TRANSACTION_TIMEOUT || '10000'),  // 10 seconds
    },
  });
};

// Singleton pattern for Prisma client
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
};

// Initialize database connection
export const initializeDatabase = async (): Promise<PrismaClient> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log('✅ Database connected successfully with connection pooling');
    
    // Test the connection
    await client.$queryRaw`SELECT 1`;
    console.log('✅ Database connection test passed');
    
    return client;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.error('❌ Database connection failed:', error);
    }
    throw error;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  }
};

// Health check
export const checkDatabaseHealth = async (): Promise<DatabaseHealthCheck> => {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      status: 'unhealthy', 
      error: errorMessage, 
      timestamp: new Date().toISOString() 
    };
  }
};

export default getPrismaClient;
