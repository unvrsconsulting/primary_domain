#!/usr/bin/env node
// Reads leadgen/data/targets.json (from find_targets.mjs) and, per target,
// writes reports/<slug>/index.html + data.js — a copy of the approved
// report-template.html (see leadgen/templates/report-template.html,
// vendored from ~/GMB-Ranking-Report) paired with that business's
// REPORT_DATA (leadgen/templates/report-data.mjs builds it). index.html,
// reports/css/style.css and reports/js/script.js are identical across
// every target — only data.js varies. That directory deploys as its OWN
// Cloudflare Worker (see reports-worker/) on a separate subdomain from
// the main site — noindex, disallow-all robots.txt, no links in from
// anywhere. Also drops a matching cold-email draft into
// leadgen/data/emails/<slug>.txt.
//
// Usage: node leadgen/scripts/generate_pages.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildReportData } from '../templates/report-data.mjs';
import { renderEmail } from '../templates/email.mjs';
import { makeSlug } from '../lib/slug.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const targetsPath = path.join(__dirname, '../data/targets.json');
const publishedPath = path.join(__dirname, '../data/published.json');
const emailsDir = path.join(__dirname, '../data/emails');
const reportsDir = path.join(repoRoot, 'reports');
const templateHtmlPath = path.join(__dirname, '../templates/report-template.html');

// Main site — used for absolute links back (booking, service pages, favicon).
const MAIN_SITE_URL = process.env.SITE_BASE_URL || 'https://universeaiconsulting.com';
// Where reports/ itself is deployed (reports-worker/, its own subdomain).
const REPORTS_BASE_URL = process.env.REPORTS_BASE_URL || 'https://rank.universeaiconsulting.com';

async function main() {
  const targets = JSON.parse(await readFile(targetsPath, 'utf8'));
  const templateHtml = await readFile(templateHtmlPath, 'utf8');
  let published = [];
  try {
    published = JSON.parse(await readFile(publishedPath, 'utf8'));
  } catch {
    // first run
  }
  const alreadyPublished = new Set(published.map((p) => `${p.business}|${p.keyword}|${p.location}`));

  await mkdir(reportsDir, { recursive: true });
  await mkdir(emailsDir, { recursive: true });

  let created = 0;
  for (const t of targets) {
    const key = `${t.business.title}|${t.keyword}|${t.location}`;
    if (alreadyPublished.has(key)) continue; // don't regenerate/re-slug existing targets

    const slug = makeSlug(t.business.title);
    const reportDir = path.join(reportsDir, slug);
    await mkdir(reportDir, { recursive: true });
    await writeFile(path.join(reportDir, 'index.html'), templateHtml);
    const reportData = buildReportData(t, MAIN_SITE_URL);
    await writeFile(path.join(reportDir, 'data.js'), `const REPORT_DATA = ${JSON.stringify(reportData, null, 2)};\n`);

    const reportUrl = `${REPORTS_BASE_URL}/${slug}/`;
    const { subject, body } = renderEmail(t, reportUrl);
    await writeFile(
      path.join(emailsDir, `${slug}.txt`),
      `To: [FILL IN — see leadgen/scripts/find_emails.mjs]\nSubject: ${subject}\n\n${body}\n`
    );

    published.push({
      slug,
      business: t.business.title,
      keyword: t.keyword,
      location: t.location,
      rank: t.business.rank,
      reportUrl,
      website: t.business.website,
      generatedAt: new Date().toISOString(),
    });
    created++;
  }

  await writeFile(publishedPath, JSON.stringify(published, null, 2));
  console.log(`Generated ${created} new report page(s) + email draft(s).`);
  console.log(`Skipped ${targets.length - created} already-published target(s).`);
  console.log(`\nReport pages: ${reportsDir}`);
  console.log(`Email drafts: ${emailsDir}`);
  console.log(`Index: ${publishedPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
