import { PrismaClient } from '@prisma/client'

// Singleton PrismaClient — reuses a single connection pool across the entire app.
// Without this, every file that does `new PrismaClient()` spins up its own pool,
// wasting connections and adding latency on every request.

const globalForPrisma = globalThis

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}

export default prisma
