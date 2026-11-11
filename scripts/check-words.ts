import { WORD_BANKS, getWordsFor } from '../src/lib/game/words/index';
import { ALL_CATEGORIES } from '../src/lib/game/types';

const issues: string[] = [];
for (const cat of ALL_CATEGORIES) {
  for (const lang of ['en', 'fa'] as const) {
    const words = WORD_BANKS[cat][lang];
    if (!words.length) { issues.push(`${cat}/${lang}: EMPTY`); continue; }
    for (const w of words) {
      if (/\s/.test(w) || w.includes('\u200c')) issues.push(`${cat}/${lang}: "${w}" has space/ZWNJ`);
    }
    console.log(`${cat.padEnd(14)} ${lang}: ${words.length} words`);
  }
  const faPlay = getWordsFor(cat, 'fa').length;
  const enPlay = getWordsFor(cat, 'en').length;
  if (!faPlay || !enPlay) issues.push(`${cat}: play-language bank empty fa=${faPlay} en=${enPlay}`);
}
console.log('\nISSUES:', issues.length ? issues : 'none');
