// Auto-play the memory board: pair cards by identical front-face markup
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const cards = [...document.querySelectorAll('.mm-card')];
  if (cards.length === 0) return 'NO CARDS';
  const sig = (c) => c.querySelector('.mm-front').innerHTML;
  const groups = {};
  cards.forEach((c) => {
    const s = sig(c);
    (groups[s] ??= []).push(c);
  });
  const sizes = Object.values(groups).map((g) => g.length);
  if (sizes.some((s) => s !== 2)) return 'BAD GROUPS: ' + sizes.join(',');
  // wait for any preview countdown to finish (banner disappears)
  for (let i = 0; i < 12; i++) {
    if (!document.body.innerText.includes('بسپار') && !document.body.innerText.includes('Memorize')) break;
    await sleep(1000);
  }
  await sleep(400);
  let clicked = 0;
  for (const g of Object.values(groups)) {
    for (const c of g) {
      c.click();
      clicked++;
      await sleep(320);
    }
    await sleep(950); // let the match settle
  }
  await sleep(1200);
  return 'CLICKED ' + clicked + ' CARDS IN ' + sizes.length + ' PAIRS';
})()
