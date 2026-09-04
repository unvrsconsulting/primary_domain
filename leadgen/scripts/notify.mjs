#!/usr/bin/env node
// Sends one email to connor@universeaiconsulting.com per published target
// that hasn't been notified yet — subject/body/client email compiled in,
// via the main site's /api/leadgen-notify endpoint (reuses its existing
// MailChannels setup; no mail credentials live in this pipeline).
//
// Requires the target site to be deployed with the matching
// LEADGEN_NOTIFY_SECRET (see leadgen/.env.example).
//
// Usage: node --env-file=leadgen/.env.local leadgen/scripts/notify.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publishedPath = path.join(__dirname, '../data/published.json');
const emailsDir = path.join(__dirname, '../data/emails');

const MAIN_SITE_URL = process.env.SITE_BASE_URL || 'https://universeaiconsulting.com';
const NOTIFY_SECRET = process.env.LEADGEN_NOTIFY_SECRET;

function parseDraft(raw) {
  const [headerBlock, ...rest] = raw.split('\n\n');
  const subjectLine = headerBlock.split('\n').find((l) => l.startsWith('Subject: '));
  return {
    subject: subjectLine ? subjectLine.replace('Subject: ', '') : '',
    body: rest.join('\n\n').trim(),
  };
}

async function main() {
  if (!NOTIFY_SECRET) {
    throw new Error('Set LEADGEN_NOTIFY_SECRET in leadgen/.env.local (must match the deployed Worker secret)');
  }

  const published = JSON.parse(await readFile(publishedPath, 'utf8'));
  let sent = 0;

  for (const entry of published) {
    if (entry.notifiedAt) continue;

    const draftPath = path.join(emailsDir, `${entry.slug}.txt`);
    const raw = await readFile(draftPath, 'utf8').catch(() => null);
    if (!raw) continue;
    const { subject, body } = parseDraft(raw);

    const res = await fetch(`${MAIN_SITE_URL}/api/leadgen-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Notify-Secret': NOTIFY_SECRET,
      },
      body: JSON.stringify({
        business: entry.business,
        keyword: entry.keyword,
        location: entry.location,
        rank: entry.rank,
        reportUrl: entry.reportUrl,
        clientEmail: entry.email || null,
        clientWebsite: entry.website || null,
        emailSubject: subject,
        emailBody: body,
      }),
    });

    if (!res.ok) {
      console.error(`FAILED notify for ${entry.business}: HTTP ${res.status} ${await res.text()}`);
      continue;
    }

    entry.notifiedAt = new Date().toISOString();
    sent++;
    console.log(`Notified: ${entry.business} (${entry.reportUrl})`);
  }

  await writeFile(publishedPath, JSON.stringify(published, null, 2));
  console.log(`\nSent ${sent} notification email(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
