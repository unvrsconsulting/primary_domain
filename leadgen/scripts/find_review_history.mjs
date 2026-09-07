#!/usr/bin/env node
// For each target in targets.json, pulls up to REVIEW_DEPTH individual
// Google reviews for the client business (not competitors — this is
// opt-in extra cost, scoped to the business actually getting a report) and
// buckets them by month posted, giving a REAL "reviews received per month"
// history. This replaces nothing — report-data.mjs's existing
// reviewProjectionTimeline is a forward-looking illustrative pitch, not a
// measurement; this is the actual historical counterpart, added as
// business.reviewHistory: [{ month: "2024-05", label: "May 2024", count }].
//
// Only as complete as whatever Google/DataForSEO surfaces for that
// listing — recent months are reliable, older ones thin out. Zero-review
// months inside that range are NOT synthesized; see bucketReviewsByMonth's
// own comment for why.
//
// Cost: DataForSEO's Reviews endpoint is task-based (submit + poll), billed
// per task plus per 10 reviews returned. REVIEW_DEPTH=100 (default) is ~10
// billing units per business. Skips targets that already have
// business.reviewHistory so re-runs are incremental — delete that field
// from a target in targets.json to force a re-fetch.
//
// Usage: node --env-file=leadgen/.env.local leadgen/scripts/find_review_history.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchGoogleReviews, bucketReviewsByMonth } from '../lib/dataforseo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetsPath = path.join(__dirname, '../data/targets.json');

const REVIEW_DEPTH = Number(process.env.REVIEW_DEPTH || 100);

async function main() {
  const targets = JSON.parse(await readFile(targetsPath, 'utf8'));

  let calls = 0;
  for (const t of targets) {
    if (t.business.reviewHistory) continue; // already fetched
    if (!t.business.placeId) {
      console.log(`SKIP ${t.business.title}: no place_id`);
      t.business.reviewHistory = [];
      continue;
    }
    if (!t.business.reviewsCount) {
      t.business.reviewHistory = [];
      continue;
    }

    calls++;
    console.log(`Fetching review history for ${t.business.title} (depth ${REVIEW_DEPTH})...`);
    try {
      const reviews = await fetchGoogleReviews(t.business.placeId, t.location, REVIEW_DEPTH);
      t.business.reviewHistory = bucketReviewsByMonth(reviews);
      console.log(`  -> ${reviews.length} reviews across ${t.business.reviewHistory.length} month(s)`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      // Leave reviewHistory unset so this target gets retried on the next run.
    }

    // Save after every business, not just at the end — this loop can run
    // for minutes (poll delay x number of targets), and a mid-run crash
    // shouldn't lose already-fetched history.
    await writeFile(targetsPath, JSON.stringify(targets, null, 2));
  }

  console.log(`\nFetched review history for ${calls} target(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
