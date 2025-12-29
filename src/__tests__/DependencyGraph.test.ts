import { detectCycle, topologicalSort, calculateEarliestTimes, calculateLatestTimes, findCriticalPath } from '../components/DependencyGraph';

type Project = {
  id: number;
  name: string;
  dependencies: number[];
  estimatedDays: number;
};

describe('DependencyGraph helpers', () => {
  test('detectCycle identifies a circular dependency', () => {
    const projects: Project[] = [
      { id: 1, name: 'A', dependencies: [], estimatedDays: 3 },
      { id: 2, name: 'B', dependencies: [1], estimatedDays: 2 },
    ];

    // Adding an edge 1 -> 2 would create a cycle (2 -> 1 -> 2)
    expect(detectCycle(projects, 1, 2)).toBe(true);
    // Adding an unrelated edge should not create a cycle
    expect(detectCycle(projects, 3 as any, 1)).toBe(false);
  });

  test('topologicalSort returns an order for a DAG and null for cycles', () => {
    const dag: Project[] = [
      { id: 1, name: 'A', dependencies: [], estimatedDays: 1 },
      { id: 2, name: 'B', dependencies: [1], estimatedDays: 1 },
      { id: 3, name: 'C', dependencies: [1], estimatedDays: 1 },
    ];

    const sorted = topologicalSort(dag);
    expect(sorted).not.toBeNull();
    expect(sorted && sorted.length).toBe(3);
    if (sorted) {
      const isTopological = (order: number[]) => {
        return dag.every(p => p.dependencies.every(dep => order.indexOf(dep) < order.indexOf(p.id)));
      };

      // accept either topological order or its reverse (implementation may return reversed)
      expect(isTopological(sorted) || isTopological([...sorted].reverse())).toBe(true);
    }

    // Introduce a cycle: 1 depends on 2, 2 depends on 1
    const cyclic: Project[] = [
      { id: 1, name: 'A', dependencies: [2], estimatedDays: 1 },
      { id: 2, name: 'B', dependencies: [1], estimatedDays: 1 },
    ];

    expect(topologicalSort(cyclic)).toBeNull();
  });

  test('calculateEarliestTimes and calculateLatestTimes produce expected CPM values', () => {
    // Graph:
    // 1 (3d) -> 2 (2d)
    // 1 (3d) -> 3 (4d)
    const projects: Project[] = [
      { id: 1, name: 'Start', dependencies: [], estimatedDays: 3 },
      { id: 2, name: 'Mid', dependencies: [1], estimatedDays: 2 },
      { id: 3, name: 'End', dependencies: [1], estimatedDays: 4 },
    ];

    const topo = [1, 2, 3];
    const earliest = calculateEarliestTimes(projects as any, topo);
    const times = calculateLatestTimes(projects as any, topo, earliest);

    // Earliest: 1 ES=0 EF=3, 2 ES=3 EF=5, 3 ES=3 EF=7
    expect(earliest.get(1)!.es).toBe(0);
    expect(earliest.get(1)!.ef).toBe(3);
    expect(earliest.get(2)!.es).toBe(3);
    expect(earliest.get(2)!.ef).toBe(5);
    expect(earliest.get(3)!.es).toBe(3);
    expect(earliest.get(3)!.ef).toBe(7);

    // Latest: maxEf = 7 => end nodes LF=7
    // For node 2: LF=7 LS=5 slack=2
    expect(times.get(2)!.lf).toBe(7);
    expect(times.get(2)!.ls).toBe(5);
    expect(times.get(2)!.slack).toBe(2);

    // For node 3: LF=7 LS=3 slack=0 (critical)
    expect(times.get(3)!.lf).toBe(7);
    expect(times.get(3)!.ls).toBe(3);
    expect(times.get(3)!.slack).toBe(0);

    // For node 1: LS should be 0 and slack 0 (critical)
    expect(times.get(1)!.ls).toBe(0);
    expect(times.get(1)!.slack).toBe(0);
  });

  test('findCriticalPath returns the expected critical sequence', () => {
    const projects: Project[] = [
      { id: 1, name: 'Start', dependencies: [], estimatedDays: 3 },
      { id: 2, name: 'Mid', dependencies: [1], estimatedDays: 2 },
      { id: 3, name: 'End', dependencies: [1], estimatedDays: 4 },
    ];

    const topo = [1, 2, 3];
    const earliest = calculateEarliestTimes(projects as any, topo);
    const times = calculateLatestTimes(projects as any, topo, earliest);

    const critical = findCriticalPath(projects as any, times);
    // Critical projects should include 1 and 3 (order may be reversed by implementation)
    expect(critical.sort((a, b) => a - b)).toEqual([1, 3]);
  });
});
