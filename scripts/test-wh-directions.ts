// Diagnostic: measure direction distribution of generated Word Hunter puzzles
import { generateWordSearch } from '../src/lib/game/wordEngine';
import type { Difficulty, Lang, CategoryId } from '../src/lib/game/types';

function classify(cells: { r: number; c: number }[]): 'H' | 'V' | 'D' {
  const first = cells[0], last = cells[cells.length - 1];
  const dr = Math.sign(last.r - first.r);
  const dc = Math.sign(last.c - first.c);
  if (dr === 0 && dc !== 0) return 'H';
  if (dr !== 0 && dc === 0) return 'V';
  return 'D';
}

const diffs: Difficulty[] = ['easy', 'normal', 'hard', 'expert'];
const langs: Lang[] = ['fa', 'en'];
const cats: CategoryId[] = ['animals', 'general', 'persianWords', 'englishWords'];

for (const lang of langs) {
  for (const diff of diffs) {
    const counts = { H: 0, V: 0, D: 0 };
    let total = 0;
    let puzzlesMissingOrientation = 0;
    let puzzleCount = 0;
    for (let i = 0; i < 60; i++) {
      const cat = cats[i % cats.length];
      const { puzzle } = generateWordSearch(cat, diff, (i % 20) + 1, lang, [], 1000 + i);
      puzzleCount++;
      const seen = new Set<string>();
      for (const p of puzzle.placements) {
        const k = classify(p.cells);
        counts[k]++;
        total++;
        seen.add(k);
      }
      if (puzzle.placements.length >= 3 && seen.size < 3) puzzlesMissingOrientation++;
    }
    const pct = (n: number) => ((n / Math.max(total, 1)) * 100).toFixed(1) + '%';
    console.log(`${lang} ${diff.padEnd(6)}  H=${counts.H} (${pct(counts.H)})  V=${counts.V} (${pct(counts.V)})  D=${counts.D} (${pct(counts.D)})  puzzles lacking H/V/D: ${puzzlesMissingOrientation}/${puzzleCount}`);
  }
}
