#!/usr/bin/env node
// Best-effort contact-email lookup for published targets. Fetches each
// business's own website (from leadgen/data/published.json) and scans the
// homepage + a guessed /contact page for a mailto: link or bare email
// address. This only surfaces publicly-published business contact info —
// it does not query any third-party people-data service.
//
// This is a low hit-rate approach (maybe 30-50% depending on trade/site
// quality). For higher coverage, pair with a paid finder (Hunter.io,
// Apollo) — swap in a lookup() call there instead of/alongside this.
//
// Usage: node leadgen/scripts/find_emails.mjs
// Writes results back into leadgen/data/published.json as `email: "..."`.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publishedPath = path.join(__dirname, '../data/published.json');

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IGNORE_DOMAINS = /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i;

async function findEmailOnPage(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const matches = html.match(EMAIL_RE) || [];
    const clean = matches.find(
      (m) => !IGNORE_DOMAINS.test(m) && !m.includes('example.com') && !m.includes('sentry.io')
    );
    return clean || null;
  } catch {
    return null;
  }
}

async function main() {
  const published = JSON.parse(await readFile(publishedPath, 'utf8'));
  let found = 0;

  for (const entry of published) {
    if (entry.email || !entry.website) continue;
    let url = entry.website;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const homepage = await findEmailOnPage(url);
    const contactPage = homepage ? null : await findEmailOnPage(new URL('/contact', url).toString());
    const email = homepage || contactPage;

    if (email) {
      entry.email = email;
      found++;
      console.log(`FOUND  ${entry.business}: ${email}`);
    } else {
      console.log(`MISS   ${entry.business} (${url}) — fill in manually`);
    }
  }

  await writeFile(publishedPath, JSON.stringify(published, null, 2));
  console.log(`\nFound ${found}/${published.length} emails. Re-run leadgen/scripts/fill_email_drafts.mjs after manually filling the rest.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
