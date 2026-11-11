import { generateWordSearch, buildPath, pathWord, DIFF_CONFIG, wordCountFor } from '../src/lib/game/wordEngine';
import { ALL_CATEGORIES, DIFFICULTIES } from '../src/lib/game/types';

// Test all categories × difficulties × languages
let failures = 0;
for (const lang of ['fa', 'en'] as const) {
  for (const cat of ALL_CATEGORIES) {
    for (const diff of DIFFICULTIES) {
      for (let level = 1; level <= 6; level++) {
        const { puzzle, usedWords } = generateWordSearch(cat, diff, level, lang, [], Math.floor(Math.random() * 1e9));
        const cfg = DIFF_CONFIG[diff];
        const expected = wordCountFor(diff, level);
        if (usedWords.length < cfg.minWords) {
          console.log(`FAIL ${cat}/${diff}/${lang}/L${level}: only ${usedWords.length}/${expected} words`);
          failures++;
        }
        // validate placements match grid letters
        for (const p of puzzle.placements) {
          for (let i = 0; i < p.word.length; i++) {
            const cell = puzzle.grid[p.cells[i].r][p.cells[i].c];
            if (cell !== p.word[i]) {
              console.log(`FAIL ${cat}/${diff}/${lang}: letter mismatch at ${p.word}`);
              failures++;
            }
          }
          // validate direction is straight
          const [first, second] = p.cells;
          const dr = Math.sign(second.r - first.r);
          const dc = Math.sign(second.c - first.c);
          for (let i = 1; i < p.cells.length; i++) {
            const expR = first.r + dr * i;
            const expC = first.c + dc * i;
            if (p.cells[i].r !== expR || p.cells[i].c !== expC) {
              console.log(`FAIL direction ${p.word}`);
              failures++;
            }
          }
        }
      }
    }
  }
}

// Test path building
const path = buildPath({ r: 2, c: 3 }, { r: 5, c: 6 }, 9);
console.log('path diag:', JSON.stringify(path), 'len', path.length);
const path2 = buildPath({ r: 0, c: 0 }, { r: 0, c: 4 }, 9);
console.log('path horiz:', JSON.stringify(path2));
const path3 = buildPath({ r: 4, c: 4 }, { r: 1, c: 2 }, 9); // knight-ish -> snaps
console.log('path snap:', JSON.stringify(path3));

console.log(failures === 0 ? '\nALL GENERATION TESTS PASSED' : `\n${failures} FAILURES`);
