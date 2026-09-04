/* =========================================================================
   LOCAL VISIBILITY REPORT — RENDER LOGIC
   Reads REPORT_DATA (see data.js) and populates the page + charts.
   You should not need to edit this file to re-brand the report.
   ========================================================================= */

(function () {
  const d = REPORT_DATA;
  const bookingLink = d.agency.bookingLink || "#";

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el != null) el.textContent = value;
  };

  // Line-style SVG icon set for the 6 services (no emoji).
  const ICONS = {
    receptionist: '<svg viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.6 21 3 12.4 3 2c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    teammate: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M15.5 8.3l1.3 1.3L19.5 6.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    autobot: '<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="7" width="14" height="11" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M12 7V4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="4" r="1.1" fill="currentColor"/><circle cx="9" cy="12.5" r="1.1" fill="currentColor"/><circle cx="15" cy="12.5" r="1.1" fill="currentColor"/><path d="M9 16h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    leadfollowup: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reviews: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6L12 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    invoicing: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v10M15 9.3c0-1.3-1.3-2.3-3-2.3s-3 .9-3 2.1c0 2.8 6 1.4 6 4.2 0 1.2-1.3 2.1-3 2.1s-3-1-3-2.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  };

  // Muted palette for competitor reference dots, so "You" (the projected
  // trajectory line) always stands out as the one thing actually moving.
  const MUTED = ["rgba(20,20,31,0.55)", "rgba(109,84,224,0.55)", "rgba(23,182,212,0.55)", "rgba(179,79,217,0.55)", "rgba(202,138,4,0.55)"];

  // ---- Theme ------------------------------------------------------------------
  document.documentElement.style.setProperty("--violet", d.theme.violet);
  document.documentElement.style.setProperty("--magenta", d.theme.magenta);
  document.documentElement.style.setProperty("--cyan", d.theme.cyan);

  if (d.theme.logoUrl) {
    document.querySelectorAll(".logo-img").forEach((img) => {
      img.src = d.theme.logoUrl;
      img.style.display = "block";
    });
  }

  // ---- Nav / global CTAs ---------------------------------------------------------
  set("nav-business", d.business.name);
  document.querySelectorAll(".js-book-cta").forEach((el) => { el.href = bookingLink; });
  document.querySelectorAll(".js-call-cta").forEach((el) => {
    el.href = `tel:${d.agency.phone.replace(/[^\d+]/g, "")}`;
    el.textContent = `Call ${d.agency.phone}`;
  });

  // ---- Hero -----------------------------------------------------------------------
  set("hero-business-name", d.business.name);
  document.title = `${d.business.name} — Local Visibility Report`;

  if (!d.business.claimed) {
    document.getElementById("unclaimed-banner").style.display = "flex";
  }

  // ---- Shared derived data (used across sections) -----------------------------------
  const maxReviews = Math.max(...d.competitors.map((c) => c.reviewCount));
  const sorted = d.competitors.slice().sort((a, b) => b.reviewCount - a.reviewCount);
  const otherCompetitors = sorted.filter((c) => !c.isClient);
  const topCompetitor = otherCompetitors[0] || sorted[0];
  const bestByRating = otherCompetitors.reduce((a, b) => (b.avgRating > a.avgRating ? b : a), otherCompetitors[0]);
  const claimedCount = otherCompetitors.filter((c) => c.claimed).length;
  const competitorsWithoutSite = otherCompetitors.filter((c) => !c.website).length;

  // ---- Hero overview scorecard -----------------------------------------------------------
  set("ov-position", `#${d.ranking.position}`);
  set("ov-position-sub", `of ${d.ranking.totalBusinesses} for this search`);
  set("ov-reviews", d.metrics.reviewCount);
  set("ov-reviews-sub", `vs ${topCompetitor.reviewCount} (${topCompetitor.name})`);
  set("ov-rating", d.metrics.avgRating.toFixed(1));
  set("ov-rating-sub", `vs ${bestByRating.avgRating.toFixed(1)} (${bestByRating.name})`);
  set("ov-profile", d.business.claimed ? "Claimed" : "Unclaimed");
  document.getElementById("ov-profile").classList.add(d.business.claimed ? "good" : "bad");

  // ---- Hero "This is where you should be" target scorecard --------------------------------
  // Every value here is set to beat the strongest competitor in that category —
  // an aspirational target, not a live measurement.
  const targetPosition = 1;
  const targetReviews = Math.ceil((topCompetitor.reviewCount + 20) / 10) * 10;
  const targetRating = Math.min(5, Math.round((bestByRating.avgRating + 0.1) * 10) / 10);

  set("tg-position", `#${targetPosition}`);
  set("tg-position-sub", `▲ up ${d.ranking.position - targetPosition} spots from today`);
  set("tg-reviews", targetReviews);
  set("tg-reviews-sub", `▲ ${targetReviews - topCompetitor.reviewCount} more than ${topCompetitor.name}`);
  set("tg-rating", targetRating.toFixed(1));
  set("tg-rating-sub", `▲ +${(targetRating - d.metrics.avgRating).toFixed(1)} from today`);
  if (!d.business.claimed) {
    set("tg-profile", "Claimed");
    set("tg-profile-sub", "▲ own & control your listing");
  } else if (!d.business.website) {
    set("tg-profile", "Website Linked");
    set("tg-profile-sub", "▲ turn browsers into leads");
  } else {
    set("tg-profile", "Fully Optimized");
    set("tg-profile-sub", "▲ claimed, linked — now defend it");
  }

  // ---- Shared trajectory-chart builder ------------------------------------------------
  // Organic, gradient-filled growth curves rather than rigid straight-line/grid
  // charts — each metric gets its own accent color so the three charts read
  // as distinct at a glance (violet = position, magenta = reviews, amber = rating).
  function withAlpha(hex, alpha) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const num = parseInt(full, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }

  // Guarantees the client's final projected point clears the top competitor's
  // value, scaling the whole authored trajectory proportionally so the curve
  // still reads as organic growth rather than a sudden jump at the end.
  // Respects the author's own numbers if they already clear the target.
  function ensureSurpassByEnd(today, projected, competitorMax, opts) {
    opts = opts || {};
    const buffer = opts.buffer != null ? opts.buffer : 0;
    let target = competitorMax + buffer;
    if (opts.cap != null) target = Math.min(target, opts.cap);

    const originalFinal = projected[projected.length - 1];
    if (originalFinal >= target) return projected;

    const span = originalFinal - today;
    const scaled = span > 0
      ? projected.map((v) => today + (v - today) * ((target - today) / span))
      : projected.map((_, i) => today + ((target - today) * (i + 1)) / projected.length);

    return opts.round ? scaled.map((v) => Math.round(v)) : scaled;
  }

  function buildTrajectoryChart(canvasId, labels, youData, competitorSeries, yAxisOpts, tooltipLabel, accentHex) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    const ctx2d = canvas.getContext("2d");
    const gradient = ctx2d.createLinearGradient(0, 0, 0, canvas.clientHeight || 260);
    gradient.addColorStop(0, withAlpha(accentHex, 0.3));
    gradient.addColorStop(1, withAlpha(accentHex, 0));

    const datasets = [{
      label: "You",
      data: youData,
      borderColor: accentHex,
      backgroundColor: gradient,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: accentHex,
      pointHoverBorderColor: "#fff",
      pointHoverBorderWidth: 2,
      pointBackgroundColor: accentHex,
      borderWidth: 2.5,
      borderCapStyle: "round",
      borderJoinStyle: "round",
      cubicInterpolationMode: "monotone",
      tension: 0.5,
      fill: true,
    }].concat(
      // Competitors render as a single reference dot at "Today", not a
      // line spanning the whole projection — you're plotting your own
      // trajectory against where they stand right now, not pretending to
      // know where they'll be in six weeks.
      competitorSeries.map((s, i) => ({
        label: s.name,
        data: s.data,
        showLine: false,
        borderColor: MUTED[i % MUTED.length],
        backgroundColor: MUTED[i % MUTED.length],
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: MUTED[i % MUTED.length],
        pointHoverBackgroundColor: MUTED[i % MUTED.length],
        fill: false,
      }))
    );
    return new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 14, bottom: 4 } },
        plugins: {
          legend: {
            position: "bottom",
            onClick: () => {}, // legend labels are informational only — clicking must not toggle a series off
            labels: { color: "#8a8aa0", boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: "circle", padding: 14, font: { size: 11, weight: "600" } },
          },
          tooltip: {
            backgroundColor: "#14141f",
            padding: 10,
            cornerRadius: 10,
            titleFont: { size: 11.5, weight: "700" },
            bodyFont: { size: 11.5 },
            callbacks: { label: tooltipLabel },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: "#a5a5b5", font: { size: 11, weight: "600" } } },
          y: Object.assign({ grid: { display: false }, border: { display: false }, ticks: { color: "#b0b0bd", font: { size: 10.5, weight: "500" } } }, yAxisOpts),
        },
      },
    });
  }

  // ---- Position section -----------------------------------------------------------
  set("position-headline-num", `#${d.ranking.position}`);
  set("position-search-term", d.ranking.searchTerm);

  set(
    "position-highlight-text",
    `${claimedCount} of your ${otherCompetitors.length} top competitors have claimed, actively-managed profiles — meaning they're already set up to respond fast. Lead Follow-Up Automation makes sure you respond faster than all of them, every time.`
  );

  // ---- Leaderboard ------------------------------------------------------------------
  // Ordered and numbered by real SERP position (c.rank), not review count —
  // rank and reviews don't always correlate, and showing review-sort order
  // as the rank number would contradict the verified position stated
  // everywhere else on the page.
  const board = document.getElementById("leaderboard");
  const rankSorted = d.competitors.slice().sort((a, b) => a.rank - b.rank);
  rankSorted.forEach((c) => {
    const row = document.createElement("div");
    row.className = `board-row ${c.isClient ? "is-client" : ""}`;
    row.innerHTML = `
      <div class="board-rank">${c.rank}</div>
      <div class="board-avatar">${c.name.slice(0, 1)}</div>
      <div class="board-main">
        <div class="board-name">${c.name}${c.isClient ? ' <span class="you-tag">this is you</span>' : ""}</div>
        <div class="board-bar-track"><div class="board-bar-fill" style="width:${(c.reviewCount / maxReviews) * 100}%"></div></div>
      </div>
      <div class="board-claimed ${c.claimed ? "claimed" : "unclaimed"}">${c.claimed ? "Claimed" : "Unclaimed"}</div>
      <div class="board-reviews">${c.reviewCount}<span>reviews</span></div>
      <div class="board-rating">${c.avgRating.toFixed(1)} ★</div>
    `;
    board.appendChild(row);
  });

  // ---- Reviews & Rating section -------------------------------------------------------
  const reviewLabels = ["Today"].concat(d.metrics.reviewProjectionTimeline.map((t) => t.label));
  const reviewProjected = ensureSurpassByEnd(
    d.metrics.reviewCount,
    d.metrics.reviewProjectionTimeline.map((t) => t.value),
    topCompetitor.reviewCount,
    { buffer: Math.max(2, Math.round(topCompetitor.reviewCount * 0.03)), round: true }
  );
  const youReviews = [d.metrics.reviewCount].concat(reviewProjected);
  // Competitors plot as a single dot at "Today" (index 0) — null everywhere
  // else so Chart.js (showLine: false) draws a point, not a line. Ordered
  // ascending by review count so the legend/draw order reads low-to-high.
  const competitorReviewSeries = otherCompetitors
    .slice()
    .sort((a, b) => a.reviewCount - b.reviewCount)
    .map((c) => ({
      name: c.name,
      data: reviewLabels.map((_, i) => (i === 0 ? c.reviewCount : null)),
    }));
  const revValues = youReviews.concat(competitorReviewSeries.flatMap((s) => s.data.filter((v) => v != null)));
  buildTrajectoryChart(
    "reviewsChart",
    reviewLabels,
    youReviews,
    competitorReviewSeries,
    { min: 0, max: Math.max(...revValues) + 20 },
    (item) => `${item.dataset.label}: ${item.parsed.y} reviews`,
    d.theme.magenta
  );
  set("reviews-stat-value", d.metrics.reviewCount);
  set("reviews-stat-badge", `↗ ${youReviews[youReviews.length - 1]} by ${reviewLabels[reviewLabels.length - 1]}`);

  const ratingLabels = ["Today"].concat(d.metrics.ratingProjectionTimeline.map((t) => t.label));
  const ratingProjected = ensureSurpassByEnd(
    d.metrics.avgRating,
    d.metrics.ratingProjectionTimeline.map((t) => t.value),
    bestByRating.avgRating,
    { buffer: 0.05, cap: 5 }
  );
  const youRatings = [d.metrics.avgRating].concat(ratingProjected);
  const competitorRatingSeries = otherCompetitors
    .slice()
    .sort((a, b) => a.avgRating - b.avgRating)
    .map((c) => ({
      name: c.name,
      data: ratingLabels.map((_, i) => (i === 0 ? c.avgRating : null)),
    }));
  const ratingValues = youRatings.concat(competitorRatingSeries.flatMap((s) => s.data.filter((v) => v != null)));
  buildTrajectoryChart(
    "ratingChart",
    ratingLabels,
    youRatings,
    competitorRatingSeries,
    { min: Math.max(0, Math.min(...ratingValues) - 0.3), max: Math.min(5, Math.max(...ratingValues) + 0.3) },
    (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(1)} ★`,
    "#ca8a04"
  );
  set("rating-stat-value", d.metrics.avgRating.toFixed(1));
  set("rating-stat-badge", `↗ ${youRatings[youRatings.length - 1].toFixed(1)} by ${ratingLabels[ratingLabels.length - 1]}`);

  const reviewGap = Math.max(topCompetitor.reviewCount - d.metrics.reviewCount, 0);
  const ratingGap = Math.max(bestByRating.avgRating - d.metrics.avgRating, 0);
  set(
    "reviews-highlight-text",
    `You're ${reviewGap} reviews and ${ratingGap.toFixed(1)} stars behind the top-rated business near you. Review requests sent right after each job close both gaps automatically.`
  );

  // ---- Profile section ----------------------------------------------------------------
  const pill = document.getElementById("profile-claimed-pill");
  pill.textContent = d.business.claimed ? "Claimed" : "Unclaimed";
  pill.classList.add(d.business.claimed ? "claimed" : "unclaimed");
  set(
    "profile-claimed-note",
    d.business.claimed
      ? "Your profile is claimed and under your control."
      : "Nobody has verified ownership of this listing yet."
  );
  set("profile-name", d.business.name);
  set("profile-category", d.business.categories[0]);
  set("profile-address", d.business.address);
  set("profile-phone", d.business.phone);

  // Rank "You" against competitors by website presence (then rating) instead
  // of always pinning the client to the top of the list.
  const catRows = [{ name: "You", hasWebsite: !!d.business.website, rating: d.metrics.avgRating, isClient: true }].concat(
    otherCompetitors.map((c) => ({ name: c.name, hasWebsite: !!c.website, rating: c.avgRating, isClient: false }))
  );
  catRows.sort((a, b) => (b.hasWebsite - a.hasWebsite) || b.rating - a.rating);
  const catBarsEl = document.getElementById("cat-bars");
  catRows.forEach((r) => {
    const row = document.createElement("div");
    row.className = `cat-bar-row ${r.isClient ? "is-client" : ""}`;
    row.innerHTML = `
      <div class="cat-bar-label"><span>${r.isClient ? "You" : r.name}${r.isClient ? ' <span class="you-tag">this is you</span>' : ""}</span><span>${r.hasWebsite ? "Website linked" : "No website"}</span></div>
      <div class="cat-bar-track"><div class="cat-bar-fill ${r.isClient ? "" : "dim"}" style="width:${r.hasWebsite ? 100 : 6}%"></div></div>
    `;
    catBarsEl.appendChild(row);
  });
  if (!d.business.website) {
    document.getElementById("cat-bars-note").style.display = "block";
  }

  set(
    "profile-highlight-text",
    !d.business.website
      ? `Your Google profile has no website linked — anyone who clicks through hits a dead end instead of your business. A Virtual Teammate keeps every profile field, including this one, filled in and current.`
      : competitorsWithoutSite > 0
      ? `Your Google profile links to a real website — ${competitorsWithoutSite} of your ${otherCompetitors.length} top competitors don't even have that. A Virtual Teammate keeps every profile field, including your site link, accurate and current.`
      : `Every top competitor already has a website linked, and so do you — the basics are covered. A Virtual Teammate keeps it that way automatically, so a missed update never quietly costs you the edge.`
  );

  // ---- Services grid (AI Automation) ---------------------------------------------------
  const servicesEl = document.getElementById("services");
  d.services.forEach((s) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.id = `service-${s.key}`;
    card.style.setProperty("--sc", s.color);
    card.innerHTML = `
      <div class="service-icon">${ICONS[s.key] || ""}</div>
      <h3>${s.title}</h3>
      <p class="service-pitch">${s.pitch}</p>
      <ul class="service-bullets">${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
      <a class="service-cta" href="${s.ctaLink || bookingLink}">${s.ctaText} →</a>
    `;
    servicesEl.appendChild(card);
  });

  // Pulse the target service card when a section's highlight CTA is clicked.
  document.querySelectorAll(".cta-highlight a[href^='#service-']").forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      target.classList.remove("pulse");
      void target.offsetWidth;
      target.classList.add("pulse");
    });
  });

  // ---- Final CTA ------------------------------------------------------------------------
  set("cta-heading", d.cta.heading);
  set("cta-subheading", d.cta.subheading);
  const ctaBtn = document.getElementById("cta-button");
  ctaBtn.textContent = d.cta.buttonText;
  ctaBtn.href = bookingLink;

  set("footer-agency", d.agency.name);
})();
