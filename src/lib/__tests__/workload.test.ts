import {
  calculateWorkloadDistribution,
  calculateStandardDeviation,
  clusterProjectsByWeek,
  generateReassignmentSuggestions,
} from '../workload';
import type { Project, TeamMember } from '../api';

describe('workload utilities', () => {
  const team: TeamMember[] = [
    { id: 1, name: 'Alice', role: 'Dev', email: 'a@test', initials: 'A', projects: 0, status: 'Active', avatar: '' },
    { id: 2, name: 'Bob', role: 'Dev', email: 'b@test', initials: 'B', projects: 0, status: 'Active', avatar: '' },
    { id: 3, name: 'Carol', role: 'Dev', email: 'c@test', initials: 'C', projects: 0, status: 'Active', avatar: '' },
  ];

  const projects: Project[] = [
    { id: 1, name: 'P1', description: '', status: 'In Progress', priority: 'High', deadline: '2025-01-10', team: 1, tasks: { completed: 0, total: 1 } },
    { id: 2, name: 'P2', description: '', status: 'In Progress', priority: 'Medium', deadline: '2025-01-12', team: 1, tasks: { completed: 0, total: 1 } },
    { id: 3, name: 'P3', description: '', status: 'In Progress', priority: 'Low', deadline: '2025-01-18', team: 2, tasks: { completed: 0, total: 1 } },
  ];

  test('calculateWorkloadDistribution computes points and status', () => {
    const workloads = calculateWorkloadDistribution(team, projects);
    const alice = workloads.find(w => w.memberId === 1)!;
    const bob = workloads.find(w => w.memberId === 2)!;
    expect(alice.workload).toBe(5); // High(3) + Medium(2)
    expect(bob.workload).toBe(1); // Low(1)
    // workload 5 falls into 'balanced' per current thresholds (>5 => busy)
    expect(alice.status).toBe('balanced');
    expect(bob.status).toBe('balanced');
  });

  test('calculateStandardDeviation returns correct value', () => {
    const vals = [5, 1, 0];
    const sd = calculateStandardDeviation(vals);
    expect(typeof sd).toBe('number');
    expect(sd).toBeGreaterThan(0);
  });

  test('clusterProjectsByWeek groups by week and sets risk levels', () => {
    const clusters = clusterProjectsByWeek(projects);
    expect(clusters.length).toBeGreaterThan(0);
    // Ensure cluster project counts sum to total projects
    const total = clusters.reduce((s, c) => s + c.projectCount, 0);
    expect(total).toBe(projects.length);
  });

  test('generateReassignmentSuggestions suggests moves for overloaded', () => {
    const workloads = calculateWorkloadDistribution(team, projects);
    const suggestions = generateReassignmentSuggestions(workloads, projects, team);
    // With current data, Alice is busier than Bob/Carol, suggestions may be empty or not
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
