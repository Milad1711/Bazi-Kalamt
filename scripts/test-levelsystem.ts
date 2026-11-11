// Sanity-check the updated engines (run with tsx)
import { memoryLevelConfig, DECK_ICONS, TOTAL_MM_LEVELS, TOTAL_WH_LEVELS } from '../src/lib/game/memoryEngine';
import { wordCountFor, DIFF_CONFIG } from '../src/lib/game/wordEngine';
import { isBossLevel } from '../src/lib/game/types';
import { ZONES, zoneForLevel, zoneUnlocked } from '../src/lib/game/zones';
import type { Difficulty, DeckId } from '../src/lib/game/types';

let fails = 0;
const check = (name: string, cond: boolean) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
  if (!cond) fails++;
};

// 1. fixed pair counts per spec: easy 5 / normal 10 / hard 15 / expert 20
const expectPairs: Record<Difficulty, number> = { easy: 5, normal: 10, hard: 15, expert: 20 };
for (const d of ['easy', 'normal', 'hard', 'expert'] as Difficulty[]) {
  for (const lv of [1, 37, 50, 73, 100]) {
    const c = memoryLevelConfig(d, lv);
    check(`${d} L${lv}: pairs=${c.pairs} cards=${c.pairs * 2} grid=${c.cols}x${c.rows}`, c.pairs === expectPairs[d]);
    check(`${d} L${lv}: cards fit grid (${c.pairs * 2} <= ${c.cols * c.rows})`, c.pairs * 2 <= c.cols * c.rows);
  }
}

// 2. boss levels every 10th with move limits, no move limit elsewhere
for (const d of ['easy', 'normal', 'hard', 'expert'] as Difficulty[]) {
  check(`${d} L10 is boss w/ moveLimit`, memoryLevelConfig(d, 10).boss && memoryLevelConfig(d, 10).moveLimit! > 0);
  check(`${d} L100 is boss`, memoryLevelConfig(d, 100).boss);
  check(`${d} L7 not boss, no moveLimit`, !memoryLevelConfig(d, 7).boss && !memoryLevelConfig(d, 7).moveLimit);
  const b = memoryLevelConfig(d, 10);
  check(`${d} boss moveLimit ${b.moveLimit} > pairs ${b.pairs}`, b.moveLimit! > b.pairs);
}

// 3. preview: levels 1,2,5,9 have it; seconds in [3,5]; others none
const has = (lv: number) => !!memoryLevelConfig('normal', lv).previewSec;
check('preview on L1/L2/L5/L9/L13', [1, 2, 5, 9, 13].every(has));
check('no preview on L3/L4/L6/L7/L8', ![3, 4, 6, 7, 8].some(has));
const pv1 = memoryLevelConfig('normal', 1).previewSec!;
const pv60 = memoryLevelConfig('normal', 61).previewSec!;
check(`preview 3..5s (L1=${pv1}, L61=${pv60})`, pv1 >= 3 && pv1 <= 5 && pv60 >= 3 && pv60 <= 5 && pv1 > pv60);

// 4. every deck has >= 20 icons and no duplicate icons inside a deck
const decks = Object.keys(DECK_ICONS) as DeckId[];
check('9 decks', decks.length === 9);
for (const dk of decks) {
  const icons = DECK_ICONS[dk];
  check(`deck ${dk}: ${icons.length} icons, all unique`, icons.length >= 20 && new Set(icons).size === icons.length);
}

// 5. totals
check(`TOTAL_MM_LEVELS=${TOTAL_MM_LEVELS} TOTAL_WH_LEVELS=${TOTAL_WH_LEVELS}`, TOTAL_MM_LEVELS === 100 && TOTAL_WH_LEVELS === 100);

// 6. zones
check('10 zones', ZONES.length === 10);
check('L1→zone0, L10→zone0, L11→zone1, L100→zone9',
  zoneForLevel(1) === ZONES[0] && zoneForLevel(10) === ZONES[0] &&
  zoneForLevel(11) === ZONES[1] && zoneForLevel(100) === ZONES[9]);
check('zone 1 locked while unlocked=10 (needs level 11)', !zoneUnlocked(10, 1) && zoneUnlocked(11, 1));

// 7. WH boss word counts — boss at least as many words, never more than max+2
for (const d of ['easy', 'normal', 'hard', 'expert'] as Difficulty[]) {
  const base = wordCountFor(d, 9);
  const boss = wordCountFor(d, 10);
  check(`WH ${d}: L10 boss words ${boss} >= L9 ${base} and <= max+2`, boss >= base && boss <= DIFF_CONFIG[d].maxWords + 2);
}

// 8. isBossLevel
check('isBossLevel 10/20/100 true, 9/21 false', isBossLevel(10) && isBossLevel(20) && isBossLevel(100) && !isBossLevel(9) && !isBossLevel(21));

// 9. normal timer starts at L6+
check('normal untimed at L1, timed at L6', !memoryLevelConfig('normal', 1).timeLimit && !!memoryLevelConfig('normal', 6).timeLimit);
check('easy never timed', !memoryLevelConfig('easy', 100).timeLimit);
const eBoss = memoryLevelConfig('expert', 10);
const eNorm = memoryLevelConfig('expert', 9);
check(`expert boss timer ${eBoss.timeLimit} < normal ${eNorm.timeLimit}`, eBoss.timeLimit! < eNorm.timeLimit!);

console.log(fails === 0 ? '\nALL CHECKS PASSED' : `\n${fails} CHECKS FAILED`);
process.exit(fails === 0 ? 0 : 1);
