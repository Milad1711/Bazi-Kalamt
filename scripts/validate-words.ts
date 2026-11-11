// Validate word banks: mixed-script garbage, spaces, ZWNJ, hyphens, length, duplicates
import { WORD_BANKS, getWordsFor } from '../src/lib/game/words/index';
import { ALL_CATEGORIES } from '../src/lib/game/types';
import type { Lang } from '../src/lib/game/types';

const faRe = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const enRe = /[a-zA-Z]/;

let problems = 0;
console.log('=== Word Bank Validation ===\n');
for (const cat of ALL_CATEGORIES) {
  for (const lang of ['fa', 'en'] as Lang[]) {
    const words = getWordsFor(cat, lang);
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const w of words) {
      const hasFa = faRe.test(w);
      const hasEn = enRe.test(w);
      if (hasFa && hasEn) issues.push(`MIXED: ${w}`);
      if (/\s/.test(w)) issues.push(`SPACE: ${w}`);
      if (w.includes('\u200c')) issues.push(`ZWNJ: ${w}`);
      if (/[-_./\\]/.test(w)) issues.push(`PUNCT: ${w}`);
      if (/[0-9]/.test(w)) issues.push(`DIGIT: ${w}`);
      if (w.length < 3) issues.push(`SHORT: ${w}`);
      if (w.length > 12) issues.push(`LONG(${w.length}): ${w}`);
      if (seen.has(w)) issues.push(`DUP: ${w}`);
      seen.add(w);
      // Arabic yeh/kaf in Persian words (common typo)
      if (hasFa && /[يك]/.test(w)) issues.push(`ARABIC-CHAR: ${w}`);
    }
    const status = issues.length ? 'ISSUES' : 'OK';
    console.log(`${cat.padEnd(14)} ${lang}: ${String(words.length).padStart(4)} words  [${status}]`);
    if (issues.length) {
      problems += issues.length;
      issues.slice(0, 12).forEach((i) => console.log(`    - ${i}`));
      if (issues.length > 12) console.log(`    ... and ${issues.length - 12} more`);
    }
  }
}
console.log(`\n=== Total problems: ${problems} ===`);
