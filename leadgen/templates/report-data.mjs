// Maps one leadgen/data/targets.json entry onto the REPORT_DATA schema
// consumed by report-template.html + reports/js/script.js — see
// ~/GMB-Ranking-Report/README.md for the full schema doc (that project is
// the source of truth for the template; this file only fills it in).

// review/rating growth is the agency's own illustrative pitch, not a
// measurement — script.js's ensureSurpassByEnd() rescales this to
// guarantee the final point clears the top competitor regardless of the
// exact shape here, so these just need to be a plausible increasing curve.
function projectReviews(current) {
  return [
    { label: 'Week 2', value: Math.round(current * 1.09) },
    { label: 'Week 4', value: Math.round(current * 1.22) },
    { label: 'Week 6', value: Math.round(current * 1.4) },
  ];
}

function projectRating(current) {
  return [
    { label: 'Week 2', value: Math.min(5, Math.round((current + 0.1) * 10) / 10) },
    { label: 'Week 4', value: Math.min(5, Math.round((current + 0.25) * 10) / 10) },
    { label: 'Week 6', value: Math.min(5, Math.round((current + 0.4) * 10) / 10) },
  ];
}

// Real service pages that exist on the main site — ctaLink left blank
// falls back to the booking link (script.js), which is also correct for
// "Review & Reputation Management" since that one has no dedicated page.
const SERVICE_URLS = {
  receptionist: '/services/ai-virtual-receptionist/',
  leadfollowup: '/services/lead-follow-up-automation/',
  teammate: '/services/ai-virtual-teammate/',
  autobot: '/services/ai-chatbot-automation/',
  invoicing: '/services/invoicing-payment-automation/',
};

const SERVICES = [
  {
    key: 'receptionist',
    color: '#d97706',
    title: 'Virtual Receptionist',
    pitch: 'Every call answered, every time — a 100% pickup rate so the phone ringing during a rush never costs you a customer again.',
    bullets: ['Answers every call, 24/7', 'Books appointments automatically', 'Routes urgent calls instantly'],
    ctaText: 'See it in action',
  },
  {
    key: 'teammate',
    color: '#6d54e0',
    title: 'Virtual Teammate',
    pitch: 'A dedicated AI that owns one role — data entry, scheduling, order processing — and works it exactly like a member of your team.',
    bullets: ['Owns one role, start to finish', 'Works your existing tools', 'Scales up for busy seasons, no hiring'],
    ctaText: 'See it in action',
  },
  {
    key: 'autobot',
    color: '#17b6d4',
    title: 'Auto-Bot',
    pitch: 'A bot trained specifically on your business — your processes, your edge cases, your tone — built to handle complex, multi-step tasks correctly.',
    bullets: ['Trained on your exact processes', 'Handles multi-step tasks end-to-end', 'Gets sharper the more it runs'],
    ctaText: 'See it in action',
  },
  {
    key: 'leadfollowup',
    color: '#b34fd9',
    title: 'Lead Follow-Up Automation',
    pitch: 'Speed wins deals — every new lead gets a response within minutes, then automatic follow-ups until they answer.',
    bullets: ['Responds to new leads in minutes', 'Never lets a lead go cold', 'Keeps following up until they reply'],
    ctaText: 'See it in action',
  },
  {
    key: 'reviews',
    color: '#ca8a04',
    title: 'Review & Reputation Management',
    pitch: 'Requests reviews at exactly the right moment and keeps a constant eye on what’s being said about you online.',
    bullets: ['Requests reviews after every job', 'Monitors Google & Yelp automatically', 'Flags negative reviews for fast response'],
    ctaText: 'See it in action',
  },
  {
    key: 'invoicing',
    color: '#1ea672',
    title: 'Invoicing & Payment Follow-Up',
    pitch: 'Invoices go out on time, and late payments get chased automatically — no more awkward collection calls.',
    bullets: ['Sends invoices automatically', 'Chases late payments for you', 'Tracks who’s paid and who hasn’t'],
    ctaText: 'See it in action',
  },
].map((s) => ({ ...s, ctaLink: SERVICE_URLS[s.key] || '' }));

/**
 * @param {object} t one entry from leadgen/data/targets.json
 * @param {string} mainSiteUrl e.g. https://universeaiconsulting.com
 */
export function buildReportData(t, mainSiteUrl) {
  const biz = t.business;
  const cityGuess = (t.location || '').split(',')[0];

  return {
    theme: { violet: '#6d54e0', magenta: '#b34fd9', cyan: '#17b6d4', logoUrl: '' },

    agency: {
      name: 'UNVRS',
      phone: '(630) 485-1413',
      bookingLink: `${mainSiteUrl}/#contact`,
    },

    business: {
      name: biz.title,
      category: biz.category || t.keyword,
      location: cityGuess,
      address: biz.address || '',
      phone: biz.phone || '',
      claimed: !!biz.claimed,
      categories: [biz.category || t.keyword],
      website: biz.website || '',
      reportDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },

    ranking: {
      position: biz.rank,
      totalBusinesses: t.totalRanked,
      searchTerm: `${t.keyword} ${cityGuess}`.trim(),
    },

    metrics: {
      reviewCount: biz.reviewsCount ?? 0,
      avgRating: biz.rating ?? 0,
      reviewProjectionTimeline: projectReviews(biz.reviewsCount ?? 0),
      ratingProjectionTimeline: projectRating(biz.rating ?? 0),
    },

    // `rank` is the real, verified SERP position (1-5 for competitors,
    // whatever the client's actual rank is) — the leaderboard numbers and
    // orders rows by this, not by review count, so the displayed rank
    // never contradicts `ranking.position` above.
    competitors: [
      { name: biz.title, rank: biz.rank, reviewCount: biz.reviewsCount ?? 0, avgRating: biz.rating ?? 0, claimed: !!biz.claimed, website: biz.website || '', isClient: true },
      ...t.competitors.map((c) => ({
        name: c.title,
        rank: c.rank,
        reviewCount: c.reviewsCount ?? 0,
        avgRating: c.rating ?? 0,
        claimed: !!c.claimed,
        website: c.website || '',
      })),
    ],

    services: SERVICES,

    sectionHighlights: { position: 'leadfollowup', reviews: 'reviews', profile: 'teammate' },

    cta: {
      heading: 'Stop losing jobs to the businesses above you.',
      subheading: "Book a free 15-minute audit — we'll show you exactly which fix gets you the fastest win.",
      buttonText: 'Book My Free Growth Audit',
    },
  };
}
