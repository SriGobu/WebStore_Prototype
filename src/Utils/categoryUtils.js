/**
 * getUniqueCategories
 *
 * Pure function — extracts a deduplicated list of category names from
 * a flat websites array, with "All" prepended as the default/no-filter
 * option. Reusable anywhere a category filter list is needed (Home,
 * future Browse page, search filters, etc.) without duplicating the
 * extraction logic at each call site.
 */
export function getUniqueCategories(websites) {
  return ["All", ...new Set(websites.flatMap((app) => app.category))];
}

/**
 * filterByCategory
 *
 * Pure function — filters a websites array by a selected category.
 * "All" (or any falsy value) returns the full list unfiltered.
 */
export function filterByCategory(websites, selectedCategory) {
  if (!selectedCategory || selectedCategory === "All") return websites;
  return websites.filter((app) => app.category.includes(selectedCategory));
}
