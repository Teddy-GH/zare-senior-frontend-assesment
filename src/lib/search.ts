/**
 * Smart Search with Fuzzy Matching
 *
 * A custom fuzzy search implementation that matches partial strings with
 * tolerance for typos using Levenshtein distance ≤ 1.
 *
 * Algorithm Overview:
 * 1. Preprocess items and query for case-insensitive matching
 * 2. For each item, search across multiple fields
 * 3. Apply scoring rules in order of priority
 * 4. Sort results by score (highest first)
 *
 * Time Complexity: O(n·m) where n = number of items, m = average string length
 * Space Complexity: O(k) where k = number of matching items
 */

import type { Project, TeamMember, ProjectFilters, TeamFilters } from "../lib/api";

/**
 * Interface for searchable items
 */
export interface SearchableItem {
  [key: string]: any;
}

/**
 * Interface for search result with score
 */
export interface SearchResult<T extends SearchableItem> {
  item: T;
  score: number;
  matchedField?: string;
  matchedValue?: string;
}

/**
 * Levenshtein distance calculation for two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
 * needed to change one string into the other
 *
 * @param a - First string
 * @param b - Second string
 * @returns Levenshtein distance between the strings
 */
function levenshteinDistance(a: string, b: string): number {
  // Optimization: if strings are identical, distance is 0
  if (a === b) return 0;

  // Optimization: if either string is empty, distance is length of other
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Create matrix with only two rows to optimize memory usage
  let previousRow = Array(a.length + 1)
    .fill(0)
    .map((_, i) => i);
  let currentRow = new Array(a.length + 1);

  for (let j = 1; j <= b.length; j++) {
    currentRow[0] = j;

    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[i] = Math.min(
        currentRow[i - 1] + 1, // deletion
        previousRow[i] + 1, // insertion
        previousRow[i - 1] + cost // substitution
      );
    }

    // Swap rows for next iteration
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[a.length];
}

/**
 * Normalize string for search:
 * - Convert to lowercase
 * - Trim whitespace
 * - Handle undefined/null values
 *
 * @param str - String to normalize
 * @returns Normalized string or empty string for falsy values
 */
export function normalizeString(str: any): string {
  if (str == null) return "";
  return String(str).toLowerCase().trim();
}

/**
 * Score a match based on the type of match found
 *
 * @param fieldValue - The field value being searched
 * @param query - The search query
 * @returns Score for this match
 */
function getMatchScore(fieldValue: string, query: string): number {
  // Exact match (case-insensitive)
  if (fieldValue === query) return 100;

  // Starts with query
  if (fieldValue.startsWith(query)) return 75;

  // Contains query
  if (fieldValue.includes(query)) return 50;

  // Fuzzy match (Levenshtein distance ≤ 1)
  if (levenshteinDistance(fieldValue, query) <= 1) return 25;

  return 0;
}

/**
 * Main search function that implements fuzzy matching across multiple fields
 *
 * @param items - Array of items to search through
 * @param query - Search query string
 * @param fields - Array of field names to search in (defaults to all string fields)
 * @returns Array of search results sorted by score (highest first)
 */
export function fuzzySearch<T extends SearchableItem>(
  items: T[],
  query: string,
  fields?: string[]
): SearchResult<T>[] {
  // Handle edge cases
  if (!items || items.length === 0) return [];

  const normalizedQuery = normalizeString(query);
  if (normalizedQuery.length === 0) return [];

  // If no fields specified, use all string fields from the first item
  let searchFields = fields;
  if (!searchFields || searchFields.length === 0) {
    searchFields = Object.keys(items[0]).filter(
      (key) =>
        typeof items[0][key] === "string" || typeof items[0][key] === "number"
    );
  }

  const results: SearchResult<T>[] = [];

  // Process each item
  for (const item of items) {
    let highestScore = 0;
    let bestField: string | undefined;
    let bestValue: string | undefined;

    // Search across all specified fields
    for (const field of searchFields) {
      const fieldValue = normalizeString(item[field]);
      if (!fieldValue) continue;

      const score = getMatchScore(fieldValue, normalizedQuery);

      // Keep the highest scoring match for this item
      if (score > highestScore) {
        highestScore = score;
        bestField = field;
        bestValue = fieldValue;
      }

      // Optimization: if we found an exact match, no need to check other fields
      if (highestScore === 100) break;
    }

    // Only include items with a match
    if (highestScore > 0) {
      results.push({
        item,
        score: highestScore,
        matchedField: bestField,
        matchedValue: bestValue,
      });
    }
  }

  // Sort results by score (highest first), with tie-breaker by field order
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // If scores are equal, prefer matches in earlier specified fields
    if (fields) {
      const aFieldIndex = fields.indexOf(a.matchedField || "");
      const bFieldIndex = fields.indexOf(b.matchedField || "");
      return aFieldIndex - bFieldIndex;
    }

    return 0;
  });
}

/**
 * Utility function to extract just the items from search results
 *
 * @param items - Array of items to search through
 * @param query - Search query string
 * @param fields - Array of field names to search in
 * @returns Array of matched items (without scores)
 */
export function searchItems<T extends SearchableItem>(
  items: T[],
  query: string,
  fields?: string[]
): T[] {
  return fuzzySearch(items, query, fields).map((result) => result.item);
}

/**
 * Project-specific search with fuzzy matching
 *
 * @param projects - Array of projects to search
 * @param query - Search query
 * @returns Filtered projects sorted by relevance
 */
export function searchProjects(projects: Project[], query: string): Project[] {
  const defaultFields = ["name", "description", "status", "priority"];
  return searchItems(projects, query, defaultFields);
}

/**
 * Team member-specific search with fuzzy matching
 *
 * @param team - Array of team members to search
 * @param query - Search query
 * @returns Filtered team members sorted by relevance
 */
export function searchTeamMembers(
  team: TeamMember[],
  query: string
): TeamMember[] {
  const defaultFields = ["name", "email", "role", "status"];
  return searchItems(team, query, defaultFields);
}

/**
 * Combine fuzzy search with existing filters
 *
 * @param items - Array of items to filter
 * @param query - Search query for fuzzy matching
 * @param filters - Additional filters (status, role, etc.)
 * @param searchFields - Fields to search in
 * @returns Filtered and sorted items
 */
export function applyFuzzySearchWithFilters<T extends SearchableItem>(
  items: T[],
  query: string,
  filters: Record<string, any> = {},
  searchFields?: string[]
): T[] {
  let filteredItems = items;

  // Apply exact filters first (for status, role, etc.)
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") {
      filteredItems = filteredItems.filter(
        (item) => normalizeString(item[key]) === normalizeString(value)
      );
    }
  });

  // Apply fuzzy search if query exists
  if (query && query.trim().length > 0) {
    return searchItems(filteredItems, query, searchFields);
  }

  return filteredItems;
}

/**
 * Example usage and test cases:
 *
 * ```typescript
 * import { projectsApi, teamApi } from '../api';
 * import { searchProjects, searchTeamMembers, fuzzySearch } from './search';
 *
 * // Fetch data from API
 * const projects = await projectsApi.getAll();
 * const team = await teamApi.getAll();
 *
 * // Example 1: Search projects with fuzzy matching
 * const projectResults = searchProjects(projects, 'dashboard');
 * // Searches in: name, description, status, priority
 *
 * // Example 2: Search team members
 * const teamResults = searchTeamMembers(team, 'developer');
 * // Searches in: name, email, role, status
 *
 * // Example 3: Advanced search with custom fields
 * const customSearch = fuzzySearch(projects, 'urgent', ['name', 'priority', 'description']);
 *
 * // Example 4: Combine with filters
 * const filteredProjects = applyFuzzySearchWithFilters(
 *   projects,
 *   'dashboard',
 *   { status: 'In Progress', priority: 'High' },
 *   ['name', 'description']
 * );
 *
 * // Example 5: Typo tolerance
 * const typoResults = searchProjects(projects, 'dashbord'); // Typo for 'dashboard'
 * // Will still match with score 25
 * ```
 *
 * Edge Cases Handled:
 * 1. Empty items array → returns []
 * 2. Empty query → returns []
 * 3. Null/undefined field values → skipped
 * 4. Case insensitive matching → works correctly
 * 5. Special characters in query → handled via normalization
 * 6. Non-string fields (numbers) → converted to strings
 * 7. No fields specified → auto-detects string/number fields
 */
