/**
 * searchWebsites
 *
 * Pure function — filters a websites array by a query string, matching
 * against name, ownerName, and tags. Case-insensitive. Returns an
 * empty array for an empty/whitespace-only query (caller decides what
 * to show in that case, e.g. "Popular searches").
 */
export function searchWebsites(websites, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return websites.filter((app) => {
    const nameMatch = app.name?.toLowerCase().includes(q);
    const ownerMatch = app.ownerName?.toLowerCase().includes(q);
    const tagMatch = app.tags?.some((tag) => tag.toLowerCase().includes(q));
    return nameMatch || ownerMatch || tagMatch;
  });
}
