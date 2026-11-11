// ============ Admin auth — secure, changeable admin password (کادر امن) ============
// Single source of truth for admin-token verification across every
// /api/admin/* route. Priority order:
//   1. DB AdminAuth row — scrypt hash of the password the owner set from the
//      panel's "Security" tab (کادر امن). When it exists it is the ONLY key:
//      env/demo fallbacks are dead.
//   2. env ADMIN_TOKEN (deployment-time secret).
//   3. demo default 'bq3-admin-demo' — demo builds only; the login screen
//      nudges the owner to replace it immediately.
// Hashing reuses the account scrypt helpers ("salt:hash", constant-time
// compare) — the plain password is never persisted anywhere.
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/server/accounts';
import type { NextRequest } from 'next/server';

export const DEMO_ADMIN_TOKEN = 'bq3-admin-demo';
export const MIN_ADMIN_PASS_LEN = 8;
export const MAX_ADMIN_PASS_LEN = 72;

function fallbackToken(): string {
  return process.env.ADMIN_TOKEN ?? DEMO_ADMIN_TOKEN;
}

/** the password the panel sends as x-admin-token */
export function adminTokenFrom(req: NextRequest): string {
  return (req.headers.get('x-admin-token') ?? '').trim();
}

/** true once the owner has set a custom password from the admin UI */
export async function hasCustomAdminPassword(): Promise<boolean> {
  try {
    const row = await db.adminAuth.findUnique({ where: { id: 'admin' } });
    return !!row;
  } catch {
    return false; // DB unavailable — env/demo fallback still authenticates
  }
}

/** verify an admin API request (async — DB lookup first). `await` it! */
export async function verifyAdminToken(req: NextRequest): Promise<boolean> {
  const token = adminTokenFrom(req);
  if (!token) return false;
  try {
    const row = await db.adminAuth.findUnique({ where: { id: 'admin' } });
    if (row) return verifyPassword(token, row.passHash);
  } catch {
    // DB unavailable — fall through to env/demo
  }
  return token === fallbackToken();
}

/** store a new admin password as a scrypt hash (plain text is never kept) */
export async function setAdminPassword(newToken: string): Promise<void> {
  const passHash = hashPassword(newToken);
  await db.adminAuth.upsert({
    where: { id: 'admin' },
    create: { id: 'admin', passHash },
    update: { passHash },
  });
}
