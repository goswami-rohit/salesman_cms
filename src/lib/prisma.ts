// src/lib/prisma.ts
// import { PrismaClient } from '@prisma/client';

// // Declare a global variable to store the PrismaClient instance.
// // This prevents multiple instances from being created during hot-reloading
// // in development, which can lead to connection pool issues.
// declare global {
//   var prisma: PrismaClient | undefined;
// }

// let prisma: PrismaClient;

// // In production, create a new PrismaClient instance directly.
// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient();
// } else {
//   // In development, use the global variable to reuse the instance if it already exists.
//   if (!global.prisma) {
//     global.prisma = new PrismaClient();
//   }
//   prisma = global.prisma;
// }

// export default prisma;

import { PrismaClient } from '@prisma/client';

// Define a function to create a new PrismaClient instance
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Use globalThis to safely store the Prisma client instance
// This prevents multiple instances during hot-reloading in development.
declare global {
  // We use globalThis to ensure the environment is correctly addressed
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Check for an existing instance on the global scope, otherwise create a new one.
// We use globalThis.prisma for a standard, environment-agnostic approach.
const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, store the instance on the global object to reuse it across hot reloads.
// In production, the client is freshly created on every cold start (which is fine).
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Export the client for use in API routes and server components.
export default prisma;
