import {
  calculateTeamStats,
  filterMockTeamData,
  generateTeamAutocompleteItems,
} from "../lib/teamHelpers";
import type { TeamMember, TeamFilters } from "@/lib/api";

const MOCK_TEAM: TeamMember[] = [
  { id: 1, name: "Alice A", role: "Dev", email: "a@x.com", projects: 2, status: "Active", avatar: "", initials: "AA" },
  { id: 2, name: "Bob B", role: "Dev", email: "b@x.com", projects: 3, status: "Inactive", avatar: "", initials: "BB" },
  { id: 3, name: "Carol C", role: "PM", email: "c@x.com", projects: 5, status: "Active", avatar: "", initials: "CC" },
];

describe("teamHelpers", () => {
  test("calculateTeamStats computes expected values", () => {
    const stats = calculateTeamStats(MOCK_TEAM);
    expect(stats.active).toBe(2);
    expect(stats.inactive).toBe(1);
    expect(stats.totalProjects).toBe(10);
    expect(stats.uniqueRoles).toBe(2);
    expect(stats.avgProjects).toBeCloseTo(10 / 3);
  });

  test("filterMockTeamData filters by search and status", () => {
    const filters1: TeamFilters = { search: "alice" };
    expect(filterMockTeamData(MOCK_TEAM, filters1)).toHaveLength(1);

    const filters2: TeamFilters = { status: "Active" };
    expect(filterMockTeamData(MOCK_TEAM, filters2)).toHaveLength(2);

    const filters3: TeamFilters = { search: "dev", status: "Inactive" };
    expect(filterMockTeamData(MOCK_TEAM, filters3)).toHaveLength(1);
  });

  test("generateTeamAutocompleteItems returns useful tokens", () => {
    const items = generateTeamAutocompleteItems(MOCK_TEAM);
    // should contain names, roles and email users
    expect(items.some((i) => i.includes("alice"))).toBe(true);
    expect(items.some((i) => i.includes("dev"))).toBe(true);
    expect(items.some((i) => i.includes("a"))).toBe(true);
  });
});
