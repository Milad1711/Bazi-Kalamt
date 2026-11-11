// Admin — content words (پنل مدیریت محتوا: بانک کلمات اختصاصی هر زبان).
// GET    /api/admin/words            — custom words + built-in bank sizes
// POST   /api/admin/words            — add { lang, category, word } (unique)
// DELETE /api/admin/words?id=...     — remove a custom word
// Auth: header x-admin-token verified via @/server/admin-auth (scrypt hash in
// DB once the owner sets a password; env/demo fallback before that — کادر امن).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WORD_BANKS } from '@/lib/game/words';
import { ALL_CATEGORIES } from '@/lib/game/types';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';
import { verifyAdminToken } from '@/server/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const [custom, counts] = await Promise.all([
    db.contentWord.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    Promise.all(ALL_CATEGORIES.map(async (c) => ({
      category: c,
      fa: WORD_BANKS[c].fa.length + await db.contentWord.count({ where: { lang: 'fa', category: c } }),
      en: WORD_BANKS[c].en.length + await db.contentWord.count({ where: { lang: 'en', category: c } }),
    }))),
  ]);
  return NextResponse.json({ ok: true, custom, counts });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`adminWords:${clientKey(req)}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl);
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: { lang?: string; category?: string; word?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const lang = body.lang === 'en' ? 'en' : 'fa';
  const category = (body.category ?? '').slice(0, 32);
  const word = (body.word ?? '').trim().replace(/\s+/g, '');

  if (!ALL_CATEGORIES.includes(category as never)) {
    return NextResponse.json({ ok: false, error: 'bad_category' }, { status: 400 });
  }
  if (word.length < 3 || word.length > 12) {
    return NextResponse.json({ ok: false, error: 'bad_word' }, { status: 400 });
  }

  try {
    const created = await db.contentWord.create({ data: { lang, category, word } });
    return NextResponse.json({ ok: true, word: created });
  } catch {
    return NextResponse.json({ ok: false, error: 'duplicate' }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ ok: false, error: 'bad_id' }, { status: 400 });
  await db.contentWord.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
