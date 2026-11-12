import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Neon's pooled endpoint (host contains "-pooler") runs PgBouncer in
// transaction mode: Prisma's cached prepared statements vanish between
// requests, so API routes crash with 500 ("prepared statement does not
// exist") even though `prisma db push` worked at build time. Prisma's
// documented fix for serverless is pgbouncer=true + a single connection,
// applied here automatically so nobody has to hand-edit the connection
// string in the host's env panel.
function tunedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url || !url.includes('-pooler')) return url // direct URL or unset — leave as-is
  if (url.includes('pgbouncer=')) return url // already tuned manually
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}pgbouncer=true&connection_limit=1`
}

// query logging only in dev — production (Netlify/Vercel/Neon) stays quiet and fast
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: tunedDatabaseUrl() } },
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
