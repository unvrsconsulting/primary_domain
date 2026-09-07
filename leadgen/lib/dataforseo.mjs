// Thin client for the DataForSEO SERP API (Google Maps live pack).
// Docs: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
// Cost: $0.002 per call in Live mode (confirmed at
// https://dataforseo.com/pricing/google-serp/google-maps-serp-api).
// Account needs a $50 minimum deposit — that's the real cost floor, not
// per-call volume (48 calls, the default nc_seed.json, is ~$0.10).

const BASE_URL = 'https://api.dataforseo.com/v3';

function authHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD (see leadgen/.env.example)');
  }
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

/**
 * Fetch the Google Maps local-pack ranking for one keyword + location.
 * @param {string} keyword e.g. "roofing contractor"
 * @param {string} locationName e.g. "Raleigh,North Carolina,United States"
 * @returns {Promise<Array>} ranked items, rank_group 1 = top result
 */
export async function fetchMapsPack(keyword, locationName) {
  const res = await fetch(`${BASE_URL}/serp/google/maps/live/advanced`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keyword,
        location_name: locationName,
        language_code: 'en',
        device: 'desktop',
      },
    ]),
  });

  if (!res.ok) {
    throw new Error(`DataForSEO HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const task = data.tasks?.[0];
  if (task?.status_code && task.status_code !== 20000) {
    throw new Error(`DataForSEO task error ${task.status_code}: ${task.status_message}`);
  }

  const items = task?.result?.[0]?.items ?? [];
  return items
    .filter((i) => i.type === 'maps_search' || i.rank_group)
    .map((i) => ({
      rank: i.rank_group,
      title: i.title,
      rating: i.rating?.value ?? null,
      reviewsCount: i.rating?.votes_count ?? 0,
      category: i.category ?? null,
      address: i.address ?? null,
      phone: i.phone ?? null,
      website: i.url ?? i.domain ?? null,
      placeId: i.place_id ?? null,
      claimed: i.is_claimed ?? null,
      // { timetable: { monday: [{open:{hour,minute}, close:{...}}] | null, ... }, current_status }
      workHours: i.work_hours ?? null,
    }));
}

/**
 * Fetch up to `depth` individual Google reviews for one business, newest
 * first, each with a real posted-on timestamp — used to build an actual
 * "reviews received per month" history (unlike the projection numbers in
 * report-data.mjs, which are illustrative, not measured).
 *
 * This is DataForSEO's task-based Reviews endpoint, not a "live" one —
 * submit a task, poll until it's ready, then fetch the result. A single
 * business can take a few seconds to a couple minutes depending on depth.
 *
 * Docs: https://docs.dataforseo.com/v3/business_data/google/reviews/task_post/
 * Billing: per task + per 10 reviews returned (depth rounds up to a
 * multiple of 10). depth: 100 is a reasonable default — enough for a
 * 12-24 month trend on most small local businesses without over-paying.
 *
 * @param {string} placeId Google place_id (same one fetchMapsPack returns)
 * @param {string} locationName e.g. "Raleigh,North Carolina,United States"
 * @param {number} depth how many reviews to pull (rounds up to nearest 10)
 * @returns {Promise<Array<{ timestamp: string, rating: number|null }>>}
 */
export async function fetchGoogleReviews(placeId, locationName, depth = 100) {
  const postRes = await fetch(`${BASE_URL}/business_data/google/reviews/task_post`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        place_id: placeId,
        location_name: locationName,
        language_name: 'English',
        depth,
        sort_by: 'newest',
      },
    ]),
  });

  if (!postRes.ok) {
    throw new Error(`DataForSEO HTTP ${postRes.status}: ${await postRes.text()}`);
  }

  const postData = await postRes.json();
  const postTask = postData.tasks?.[0];
  if (postTask?.status_code && postTask.status_code !== 20100 && postTask.status_code !== 20000) {
    throw new Error(`DataForSEO task_post error ${postTask.status_code}: ${postTask.status_message}`);
  }
  const taskId = postTask?.id;
  if (!taskId) {
    throw new Error('DataForSEO task_post returned no task id');
  }

  // Poll task_get until the task is ready. Reviews tasks are async — there's
  // no live/instant endpoint for this data — so this just waits.
  const maxAttempts = 20;
  const delayMs = 8000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delayMs));

    const getRes = await fetch(`${BASE_URL}/business_data/google/reviews/task_get/${taskId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!getRes.ok) {
      throw new Error(`DataForSEO HTTP ${getRes.status}: ${await getRes.text()}`);
    }
    const getData = await getRes.json();
    const getTask = getData.tasks?.[0];

    if (getTask?.status_code === 40602) continue; // task in progress, keep polling
    if (getTask?.status_code && getTask.status_code !== 20000) {
      throw new Error(`DataForSEO task_get error ${getTask.status_code}: ${getTask.status_message}`);
    }

    const items = getTask?.result?.[0]?.items ?? [];
    if (!items.length && getTask?.result == null) continue; // not ready yet

    return items.map((i) => ({
      timestamp: i.timestamp ?? null, // ISO 8601, e.g. "2024-05-05 14:09:32 +00:00"
      rating: i.rating?.value ?? null,
    }));
  }

  throw new Error(`DataForSEO reviews task ${taskId} did not complete after ${(maxAttempts * delayMs) / 1000}s`);
}

/**
 * Buckets raw review timestamps into { month: "2025-01", label: "Jan 2025",
 * count } entries, sorted chronologically oldest-to-newest, with zero-count
 * months filled in *between* the earliest and latest month seen. That gap-
 * filling is safe specifically because DataForSEO returns reviews sorted
 * and contiguous (sort_by: 'newest') — if a month between two observed
 * reviews has no entries, that month genuinely had zero reviews, not a
 * data-collection gap. What's NOT implied: completeness *before* the
 * earliest bucket — that's just wherever `depth` ran out or Google stopped
 * surfacing older reviews, not necessarily the business's first-ever review.
 */
export function bucketReviewsByMonth(reviews) {
  const counts = new Map();
  for (const r of reviews) {
    if (!r.timestamp) continue;
    const month = r.timestamp.slice(0, 7); // "2024-05-05 ..." -> "2024-05"
    counts.set(month, (counts.get(month) || 0) + 1);
  }
  if (!counts.size) return [];

  const months = [...counts.keys()].sort();
  const [startYear, startMonth] = months[0].split('-').map(Number);
  const [endYear, endMonth] = months[months.length - 1].split('-').map(Number);

  const result = [];
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    result.push({ month: key, label, count: counts.get(key) || 0 });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return result;
}
