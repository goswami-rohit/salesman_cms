// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declare a global variable to store the PrismaClient instance.
// This prevents multiple instances from being created during hot-reloading
// in development, which can lead to connection pool issues.
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// In production, create a new PrismaClient instance directly.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use the global variable to reuse the instance if it already exists.
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;