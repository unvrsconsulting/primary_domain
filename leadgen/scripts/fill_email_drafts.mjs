#!/usr/bin/env node
// Patches the "To: [FILL IN]" line in each leadgen/data/emails/<slug>.txt
// draft with the email found by find_emails.mjs (or manually added to
// leadgen/data/published.json). Run after find_emails.mjs.
//
// Usage: node leadgen/scripts/fill_email_drafts.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publishedPath = path.join(__dirname, '../data/published.json');
const emailsDir = path.join(__dirname, '../data/emails');

async function main() {
  const published = JSON.parse(await readFile(publishedPath, 'utf8'));
  let patched = 0;

  for (const entry of published) {
    if (!entry.email) continue;
    const draftPath = path.join(emailsDir, `${entry.slug}.txt`);
    let draft;
    try {
      draft = await readFile(draftPath, 'utf8');
    } catch {
      continue;
    }
    const updated = draft.replace(/^To: .*$/m, `To: ${entry.email}`);
    if (updated !== draft) {
      await writeFile(draftPath, updated);
      patched++;
    }
  }

  console.log(`Patched ${patched} draft(s) with a known email address.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
