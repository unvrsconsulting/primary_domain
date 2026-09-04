#!/usr/bin/env node
// One-shot pipeline: generate pages -> find emails -> patch drafts ->
// notify Connor -> deploy reports-worker/ live.
//
// Deliberately does NOT touch git. reports/ holds real business names,
// phone numbers, addresses, and competitor comparisons — unvrsconsulting/
// primary_domain is a PUBLIC repo, so that content is gitignored (see
// .gitignore) and only ever goes to Cloudflare via `wrangler deploy`,
// never into git history.
//
// This is still the "auto-publish" entrypoint — it deploys for real, a
// production action. Run it deliberately, not as a blind default.
//
// Usage: node --env-file=leadgen/.env.local leadgen/scripts/publish.mjs

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const reportsWorkerDir = path.join(repoRoot, 'reports-worker');

function run(cmd, args, cwd) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function runScript(scriptPath) {
  run(process.execPath, [scriptPath], repoRoot);
}

async function main() {
  runScript(path.join(__dirname, 'generate_pages.mjs'));
  runScript(path.join(__dirname, 'find_emails.mjs'));
  runScript(path.join(__dirname, 'fill_email_drafts.mjs'));
  runScript(path.join(__dirname, 'notify.mjs'));
  run('npx', ['wrangler', 'deploy'], reportsWorkerDir);

  console.log('\nDone. New reports are live.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
