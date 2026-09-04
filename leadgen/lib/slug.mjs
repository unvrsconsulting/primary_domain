import { randomBytes } from 'node:crypto';

// Business-name slug + random token, so report URLs aren't guessable/
// enumerable even though robots.txt + noindex already keep them out of
// search and crawlers.
export function makeSlug(businessName) {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const token = randomBytes(3).toString('hex');
  return `${base}-${token}`;
}
