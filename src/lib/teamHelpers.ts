import type { TeamMember, TeamFilters } from './api';

export interface TeamStats {
  active: number;
  inactive: number;
  totalProjects: number;
  uniqueRoles: number;
  avgProjects: number;
}

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
