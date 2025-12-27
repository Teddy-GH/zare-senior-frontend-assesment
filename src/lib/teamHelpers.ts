import type { TeamMember, TeamFilters } from './api';

/**
 * Summarized team statistics used by the Team page.
 * - `avgProjects` is a simple arithmetic mean (totalProjects / members).
 */
export interface TeamStats {
  active: number;
  inactive: number;
  totalProjects: number;
  uniqueRoles: number;
  avgProjects: number;
}

/**
 * Compute small, display-oriented statistics about the team.
 *
 * This is intentionally simple — it helps the UI show counts and an
 * average. All fields are deterministic and safe to call with `undefined`.
 */
export const calculateTeamStats = (teamMembers?: TeamMember[]): TeamStats => {
  if (!teamMembers || teamMembers.length === 0) {
    return { active: 0, inactive: 0, totalProjects: 0, uniqueRoles: 0, avgProjects: 0 };
  }

  const active = teamMembers.filter((m) => m.status === 'Active').length;
  const inactive = teamMembers.filter((m) => m.status === 'Inactive').length;
  const totalProjects = teamMembers.reduce((sum, m) => sum + (m.projects || 0), 0);
  const uniqueRoles = new Set(teamMembers.map((m) => m.role)).size;
  const avgProjects = totalProjects / teamMembers.length;

  return { active, inactive, totalProjects, uniqueRoles, avgProjects };
};

/**
 * Apply simple in-memory filters to mock team data. This mirrors the
 * server-side filtering used in the real API so the dev-mode mock behaves
 * consistently with production.
 *
 * Supported filters:
 * - `search`: case-insensitive substring match against `name`, `role`, or `email`.
 * - `status`: either `Active` or `Inactive` to narrow results.
 */
export const filterMockTeamData = (data: TeamMember[], filters?: TeamFilters): TeamMember[] => {
  if (!filters) return data;
  let filtered = [...data];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (member) =>
        member.name.toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
    );
  }

  if (filters.status === 'Active') filtered = filtered.filter((m) => m.status === 'Active');
  else if (filters.status === 'Inactive') filtered = filtered.filter((m) => m.status === 'Inactive');

  return filtered;
};

/**
 * Build a compact list of tokens useful for autocomplete.
 *
 * For each team member we include:
 * - full lowercase `name`
 * - `role`
 * - the portion of the email before `@`
 * - individual name parts (first/last)
 *
 * Returning a `Set`-backed array deduplicates tokens and keeps suggestions
 * reasonably focused.
 */
export const generateTeamAutocompleteItems = (teamMembers?: TeamMember[]): string[] => {
  if (!teamMembers) return [];
  const items = new Set<string>();
  teamMembers.forEach((member) => {
    items.add(member.name.toLowerCase());
    items.add(member.role.toLowerCase());
    const emailUser = member.email.split('@')[0];
    items.add(emailUser.toLowerCase());
    const nameParts = member.name.toLowerCase().split(' ');
    nameParts.forEach((p) => { if (p.length > 1) items.add(p); });
  });
  return Array.from(items);
};
