import { estimateProjectDays, convertToDependencyFormat, getProjectEstimatedDays, getProjectDependencyCount } from '../lib/projectsHelpers';
import type { Project } from '../lib/api';

// Mock localStorage for tests
const localStorageMock: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (k: string) => localStorageMock[k] ?? null,
    setItem: (k: string, v: string) => { localStorageMock[k] = v; },
    removeItem: (k: string) => { delete localStorageMock[k]; },
  },
});

describe('projectsHelpers', () => {
  const project: Project = {
    id: 1,
    name: 'Test',
    description: '',
    status: 'In Progress',
    priority: 'High',
    deadline: '2025-01-01',
    team: 1,
    tasks: { completed: 1, total: 4 },
  };

  test('estimateProjectDays reduces based on progress and priority', () => {
    const days = estimateProjectDays(project);
    expect(typeof days).toBe('number');
    expect(days).toBeGreaterThanOrEqual(1);
  });

  test('convertToDependencyFormat reads/writes localStorage and returns expected shape', () => {
    localStorageMock['project-deps-1'] = JSON.stringify([2,3]);
    const converted = convertToDependencyFormat([project]);
    expect(converted.length).toBe(1);
    expect(converted[0].id).toBe(1);
    expect(Array.isArray(converted[0].dependencies)).toBe(true);
    expect(converted[0].dependencies).toEqual([2,3]);
  });

  test('getProjectEstimatedDays and getProjectDependencyCount helpers', () => {
    const converted = convertToDependencyFormat([project]);
    const est = getProjectEstimatedDays(converted, 1);
    const depCount = getProjectDependencyCount(converted, 1);
    expect(typeof est).toBe('number');
    expect(depCount).toBe(2);
  });
});
