// ============ Word Bank Index ============
import type { CategoryId, Lang } from '../types';
import { bankA } from './bank-a';
import { bankB } from './bank-b';
import { bankC, LANGUAGE_CATEGORIES } from './bank-c';

type Bank = { en: string[]; fa: string[] };

const raw: Partial<Record<CategoryId, Bank>> = { ...bankA, ...bankB, ...bankC };

function clean(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of list) {
    const word = w.trim();
    // no spaces, no ZWNJ, valid length
    if (!word || /\s/.test(word) || word.includes('\u200c')) continue;
    if (word.length < 3 || word.length > 12) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

export const WORD_BANKS: Record<CategoryId, Bank> = Object.fromEntries(
  Object.entries(raw).map(([cat, bank]) => [
    cat as CategoryId,
    { en: clean(bank!.en), fa: clean(bank!.fa) },
  ]),
) as Record<CategoryId, Bank>;

/** Words for a category: language categories always use their own script */
export function getWordsFor(category: CategoryId, lang: Lang): string[] {
  const bank = WORD_BANKS[category];
  const langCat = LANGUAGE_CATEGORIES[category as keyof typeof LANGUAGE_CATEGORIES];
  const base = langCat ? bank[langCat] : bank[lang];
  // merge admin-panel custom words (deduped) — بانک زنده هر زبان
  const extra = customWords[category]?.[lang] ?? [];
  if (!extra.length) return base;
  return [...base, ...extra.filter((w) => !base.includes(w))];
}

export function bankSize(category: CategoryId, lang: Lang): number {
  return getWordsFor(category, lang).length;
}

// ---------- admin-panel custom words (پنل مدیریت محتوا) ----------
const customWords: Partial<Record<CategoryId, { fa: string[]; en: string[] }>> = {};

/** fetch the admin-added words for a language and merge them into the bank */
export async function loadCustomWords(lang: Lang): Promise<void> {
  try {
    const res = await fetch(`/api/content/words?lang=${lang}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { words: Record<string, string[]> };
    for (const [cat, words] of Object.entries(data.words ?? {})) {
      const entry = (customWords[cat as CategoryId] ??= { fa: [], en: [] });
      if (lang === 'fa') entry.fa = [...entry.fa, ...words];
      else entry.en = [...entry.en, ...words];
    }
  } catch {
    // offline — the bundled banks still work
  }
}
