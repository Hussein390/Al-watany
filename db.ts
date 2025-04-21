import { PrismaClient } from "@prisma/client"
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
export const db = globalForPrisma.prisma || new PrismaClient({
    // required to avoid the 'prepared statement already exists' error
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

