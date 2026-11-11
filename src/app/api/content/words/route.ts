// GET /api/content/words?lang=fa — custom words added from the admin panel.
// The game merges these into its bundled per-language word banks at runtime,
// so new content goes live without shipping a new client build.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'fa';
  try {
    const rows = await db.contentWord.findMany({
      where: { lang },
      select: { category: true, word: true },
    });
    const byCat: Record<string, string[]> = {};
    for (const r of rows) {
      (byCat[r.category] ??= []).push(r.word);
    }
    return NextResponse.json(
      { ok: true, lang, words: byCat },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ ok: true, lang, words: {} }); // offline-safe
  }
}
