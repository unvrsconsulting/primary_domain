// Cold outreach email draft. CAN-SPAM (15 U.S.C. §7701 et seq.) requires,
// for commercial email: accurate from/subject, a valid physical mailing
// address, and a working opt-out honored within 10 business days.
// Fill in COMPANY_MAILING_ADDRESS below before sending anything.
const COMPANY_MAILING_ADDRESS = '221 Obsidian Drive, Holly Springs, NC 27540';

/**
 * @param {object} t one entry from leadgen/data/targets.json
 * @param {string} reportUrl full published URL of that business's report page
 */
export function renderEmail(t, reportUrl) {
  const biz = t.business;
  const topCompetitor = [...t.competitors].sort((a, b) => a.rank - b.rank)[0];
  const cityGuess = (t.location || '').split(',')[0];

  const subject = `${biz.title} is #${biz.rank} for "${t.keyword}" in ${cityGuess} — here's the gap`;

  const body = `Hi there,

I pulled up local search results for "${t.keyword}" in ${cityGuess} and noticed ${biz.title} is showing up at #${biz.rank}${topCompetitor ? `, behind ${topCompetitor.title} and a few others in the top 5` : ''}.

I put together a quick breakdown of where you stand vs. the businesses currently outranking you — reviews, rating, profile completeness:

${reportUrl}

No pitch in there, just the numbers. If it's useful, happy to walk through 2-3 fixes that would close the gap fastest.

${topCompetitor ? `Worth noting: ${topCompetitor.title} has ${topCompetitor.reviewsCount ?? 0} reviews at a ${topCompetitor.rating ?? '—'} rating. ` : ''}Most of the businesses ahead of you are just faster to respond and better at asking for reviews — both fixable.

Worth a 15-minute call?

Connor
UNVRS
hello@universeaiconsulting.com
(630) 485-1413
https://universeaiconsulting.com

---
${COMPANY_MAILING_ADDRESS}
If you'd rather not hear from us again, reply "unsubscribe" and we'll remove you.`;

  return { subject, body };
}
