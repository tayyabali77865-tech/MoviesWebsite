import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// On Vercel, we need to ensure the database file path is absolute 
// so the serverless functions can find it reliably.
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const datasourceUrl = process.env.NODE_ENV === 'production'
  ? `file:${dbPath}`
  : undefined;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: datasourceUrl ? {
      db: {
        url: datasourceUrl
      }
    } : undefined
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
