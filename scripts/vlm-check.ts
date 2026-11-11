// Visual QA of screenshots via VLM (z-ai-web-dev-sdk, backend only)
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) { console.log('usage: bun run scripts/vlm-check.ts <img...>'); process.exit(1); }
  const zai = await ZAI.create();
  for (const f of files) {
    const b64 = fs.readFileSync(f).toString('base64');
    try {
      const res = await zai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'This is a screenshot of a mobile game UI (Persian RTL). Briefly: 1) Does it look visually polished and colorful (3D buttons, cards, gradients)? 2) Any layout breakage, overlapping/cut-off text, blank areas, or missing graphics? 3) Is Persian text rendering correctly (not tofu boxes)? Answer in English, max 80 words, verdict PASS or FAIL at start.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          },
        ],
      });
      console.log(`\n=== ${f} ===\n${res.choices[0]?.message?.content ?? 'NO RESPONSE'}`);
    } catch (e) {
      console.log(`\n=== ${f} === VLM ERROR: ${e instanceof Error ? e.message : e}`);
    }
  }
}
main();
