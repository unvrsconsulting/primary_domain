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
    }));
}
