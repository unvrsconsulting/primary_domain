# Leadgen pipeline (NC outreach funnel)

Finds NC businesses ranked outside the top 5 local-pack results for a
keyword+location, generates a personalized "visibility report" landing
page for each on its own subdomain, and drafts a cold email pointing at
it. Each finished draft gets emailed to **connor@universeaiconsulting.com**
for review — nothing here emails the target business directly. That send
is still yours to make, by hand (see "Sending", below).

**The report page itself is [~/GMB-Ranking-Report](https://github.com/connorbolin/GMB-Ranking-Report)**
(private repo, not this one) — vendored into
`leadgen/templates/report-template.html` + `reports/css/style.css` +
`reports/js/script.js`, unmodified except two asset paths (made
root-absolute so they work from any `/<slug>/` depth), a `noindex` meta
tag, and one line in `script.js` setting the tab title per business. That
project's own README is the real spec for the page's data schema and
design intent — `leadgen/templates/report-data.mjs` only maps
`targets.json` onto it. If the template ever changes upstream, re-copy
those three files and reapply the same three tweaks.

**Known gap:** the template's footer says competitor data comes from
DataForSEO's Business Listings API — this pipeline actually pulls
competitors from the same Maps SERP call, which only returns one
category per listing. `categoryCount` is hardcoded to `1` for every
business as a result, which flattens the "category coverage" comparison
section. Wire in a real Business Listings API call to fix, or edit the
footer claim.

## Setup

```bash
cp leadgen/.env.example leadgen/.env.local
# fill in DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from https://app.dataforseo.com
```

Edit `leadgen/data/nc_seed.json` — the keyword x city combos to sweep.
Each combo is one billed DataForSEO call.

## Run order

Step by step:

```bash
node --env-file=leadgen/.env.local leadgen/scripts/find_targets.mjs
node --env-file=leadgen/.env.local leadgen/scripts/generate_pages.mjs
node --env-file=leadgen/.env.local leadgen/scripts/find_emails.mjs
node --env-file=leadgen/.env.local leadgen/scripts/fill_email_drafts.mjs
node --env-file=leadgen/.env.local leadgen/scripts/notify.mjs
```

Or all of steps 2-5 at once, including the actual publish (deploy
`reports-worker/` live):

```bash
node --env-file=leadgen/.env.local leadgen/scripts/publish.mjs
```

`publish.mjs` runs a real `wrangler deploy` — run it deliberately, once
you've spot-checked `find_targets.mjs` output, not as a reflex after
every sweep. It never touches git — `unvrsconsulting/primary_domain` is
a **public** repo, and `reports/*/` (real business names, phone numbers,
addresses, competitor data) is gitignored on purpose. Deployment goes
straight from local files to Cloudflare.

1. **find_targets.mjs** — pulls Google Maps local-pack rankings per
   keyword+location, keeps everyone ranked below #5, snapshots the top-5
   as their competitor set. Writes `leadgen/data/targets.json`. Costs
   money (see "Cost" below) — run this one on its own and check the
   output before chaining into `publish.mjs`.
2. **generate_pages.mjs** — renders `reports/<slug>/index.html` per
   target (noindex/nofollow, subdomain-wide `Disallow: /`, random slug
   suffix so it's not guessable) and a matching email draft in
   `leadgen/data/emails/<slug>.txt`. Skips targets already published so
   re-runs are incremental. Logs everything to
   `leadgen/data/published.json`.
3. **find_emails.mjs** — best-effort scrape of each target's own website
   for a public contact email (mailto: link or bare address on the
   homepage/contact page). Hit rate is partial — no third-party
   people-data lookup is wired in. Fill in the rest manually in
   `published.json`.
4. **fill_email_drafts.mjs** — patches the `To:` line in each draft once
   an email is known.
5. **notify.mjs** — POSTs each un-notified target to the main site's
   `/api/leadgen-notify` endpoint, which emails the compiled draft +
   client email + report link to connor@universeaiconsulting.com via
   the same MailChannels setup the contact form already uses. Requires
   `LEADGEN_NOTIFY_SECRET` in `leadgen/.env.local` to match the value set
   on the Worker:
   ```bash
   npx wrangler secret put LEADGEN_NOTIFY_SECRET
   ```
   (paste the value from `leadgen/.env.local`, then redeploy the main
   site so the secret takes effect). This only sends to your own inbox —
   nothing here emails the target business directly.

Then deploy `reports-worker/` (see "Deploying", below) — nothing here
publishes on its own. `reports/*/` output is gitignored (this repo is
public — see "Deploying" for why), so `git commit`/`push` never touches
it either way; only `wrangler deploy` from inside `reports-worker/` puts
pages live.

## Why report pages won't get indexed

- entire subdomain's `robots.txt` (`reports/robots.txt`) is `Disallow: /`
- every generated page also carries its own `<meta name="robots" content="noindex, nofollow">`
- pages aren't linked from anywhere on the main site or in its `sitemap.xml`
- slugs include a random suffix, so they aren't guessable/enumerable
- it's a fully separate Worker deploy (`reports-worker/`) on its own
  subdomain — no shared routes, no shared sitemap, no path on the main
  domain at all

## Deploying reports-worker/ (one-time setup)

This is a second, independent Cloudflare Worker — deliberately separate
from the main site's Worker, so outreach pages don't share the main
domain's crawl footprint or (if you later send from a matching mail
subdomain) its email reputation.

```bash
cd reports-worker
npx wrangler deploy
```

That publishes it to `unvrs-reports.<your-account>.workers.dev`. To put
it on a real subdomain — done: `rank.universeaiconsulting.com` is
attached as a Custom Domain to `unvrs-reports`. For reference, here's
how that step works if you ever repeat it:

1. Cloudflare dashboard → Workers & Pages → `unvrs-reports` → Settings →
   Domains & Routes → **Add → Custom Domain** → enter the subdomain.
2. Cloudflare provisions the DNS record and SSL cert itself — proxied
   (orange cloud), automatically. You don't need to touch the DNS tab
   manually for this; the Custom Domain wizard does it.
3. Update `REPORTS_BASE_URL` in `leadgen/.env.local` to match, and
   re-run `generate_pages.mjs` so new email drafts link to the right host
   (already-published entries in `published.json` keep their old URL —
   regenerate those manually if you change the subdomain later).

If you'd rather add the DNS record yourself instead of using the Custom
Domain wizard (e.g. your DNS is managed by someone else): CNAME, name =
the subdomain, target = `unvrs-reports.<your-account>.workers.dev`,
**proxied**. A proxied CNAME alone isn't enough for Workers though — you
also need a Route binding that subdomain to the `unvrs-reports` Worker
(dashboard → Domains & Routes → Add → Route, or the wizard in step 1,
which does both at once). The Custom Domain path above is simpler and
does both steps for you.

Each `git push` to this repo redeploys the *main* site only (assuming
CI/CD is wired to `wrangler deploy` at the repo root) — `reports-worker/`
needs its own `wrangler deploy` run from inside that folder, since it's a
separate Worker with its own `wrangler.jsonc`.

**`reports/*/` is gitignored, deliberately.** `unvrsconsulting/primary_domain`
is a public GitHub repo. Generated report pages carry real business
names, phone numbers, addresses, and competitor comparisons — that has
no business in public git history, noindex or not. `publish.mjs` and the
`wrangler deploy` above send that content straight to Cloudflare without
ever committing it. `reports/report.css` and `reports/robots.txt` (no
business data) stay tracked.

## Sending — do this part yourself, deliberately

This pipeline stops at drafts on purpose. Before sending anything in
`leadgen/data/emails/`:

- [x] `COMPANY_MAILING_ADDRESS` filled in `leadgen/templates/email.mjs`
      — currently your home address (221 Obsidian Drive, Holly Springs).
      CAN-SPAM only requires *a* valid address, not a business one — but
      it goes out to every recipient. A UPS Store box or registered-agent
      address is worth it if you'd rather not put your home address in
      front of strangers you're cold-emailing.
- [ ] Keep the unsubscribe line, and actually honor opt-outs within 10
      business days (CAN-SPAM requirement).
- [ ] Don't spoof the From/Reply-To — send as yourself or a real UNVRS
      address.
- [ ] Send from an address/domain with headroom in its sending
      reputation — a burst of cold outreach can affect deliverability
      for your main business email. Consider a dedicated sending
      subdomain if volume gets meaningful.
- [ ] Spot-check a sample of report pages before a send batch — data
      pulled from DataForSEO can be stale or wrong (wrong branch
      location, defunct business, etc).

## Cost

Google Maps Live mode is $0.002/call (confirmed at
https://dataforseo.com/pricing/google-serp/google-maps-serp-api). The
default `nc_seed.json` (6 cities x 8 keywords = 48 calls) is ~$0.10. The
real cost floor is DataForSEO's $50 account minimum, not call volume —
even a NC-wide sweep (hundreds of combos) stays under a few dollars.
Widen `nc_seed.json` freely; there's no real reason to keep it small
beyond validating the pipeline output first.
