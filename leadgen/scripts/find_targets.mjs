#!/usr/bin/env node
// Sweeps NC keyword+location combos via DataForSEO, keeps businesses that
// rank OUTSIDE the top 5 local-pack spots, and captures the top-5 set as
// their competitor snapshot. Writes leadgen/data/targets.json.
//
// Usage:
//   DATAFORSEO_LOGIN=... DATAFORSEO_PASSWORD=... node leadgen/scripts/find_targets.mjs
//
// Or put credentials in leadgen/.env.local (gitignored) and load with
// `node --env-file=leadgen/.env.local leadgen/scripts/find_targets.mjs`

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchMapsPack } from '../lib/dataforseo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '../data/nc_seed.json');
const outPath = path.join(__dirname, '../data/targets.json');

const MAX_RANK_TO_SHOW = 5; // top 5 pack = "not a target"
// DataForSEO's Maps Live endpoint returns up to ~100 ranked results per
// search, not just the local 3/5-pack — rank 80 is a real listing but not
// a useful outreach target. Cap how far past #5 counts as "close enough
// to be worth pitching", and how many per keyword+location to keep (the
// closest-ranked ones make the strongest "you're right behind them"
// pitch; taking all of them just spams near-duplicate targets in the
// same tiny local market).
const MAX_RANK_CEILING = 15;
const MAX_TARGETS_PER_COMBO = 3;
const REQUEST_DELAY_MS = 500; // be polite to the API, avoid rate limits

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, 'utf8'));
  const targets = [];
  let calls = 0;

  for (const location of seed.locations) {
    for (const keyword of seed.keywords) {
      calls++;
      let items;
      try {
        items = await fetchMapsPack(keyword, location);
      } catch (err) {
        console.error(`FAILED ${keyword} / ${location}:`, err.message);
        continue;
      }

      const top5 = items.filter((i) => i.rank <= MAX_RANK_TO_SHOW);
      const outsideTop5 = items
        .filter((i) => i.rank > MAX_RANK_TO_SHOW && i.rank <= MAX_RANK_CEILING)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, MAX_TARGETS_PER_COMBO);

      for (const target of outsideTop5) {
        targets.push({
          keyword,
          location,
          business: target,
          competitors: top5,
          totalRanked: items.length,
          foundAt: new Date().toISOString(),
        });
      }

      console.log(
        `[${calls}] ${keyword} / ${location}: ${items.length} ranked, ${outsideTop5.length} target(s)`
      );
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(targets, null, 2));
  console.log(`\nWrote ${targets.length} targets from ${calls} API calls -> ${outPath}`);
  console.log('Estimate cost at your DataForSEO plan rate x call count above.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
