import { fuzzySearch, normalizeString, applyFuzzySearchWithFilters, searchProjects, searchTeamMembers } from '../lib/search';

type Item = { name?: string; description?: string; email?: string; role?: string };

describe('fuzzySearch', () => {
  const items: Item[] = [
    { name: 'Mobile App Redesign', description: 'Cross-platform mobile app', email: 'mobile@acme.test', role: 'Product' },
    { name: 'API Migration', description: 'Migrate legacy APIs', email: 'api@acme.test', role: 'Backend' },
    { name: 'Analytics Dashboard', description: 'Dashboard for metrics', email: 'data@acme.test', role: 'Data' },
    { name: 'User Onboarding', description: 'Improved onboarding flow', email: 'ux@acme.test', role: 'UX' },
    { name: 'DashBoard', description: 'Case Variation', email: 'case@acme.test', role: 'QA' },
  ];

  test('returns empty array for empty items or empty query', () => {
    expect(fuzzySearch([], 'test')).toEqual([]);
    expect(fuzzySearch(items, '')).toEqual([]);
    expect(fuzzySearch(items, '   ')).toEqual([]);
  });

  test('exact match scores highest (100)', () => {
    const list = [{ name: 'mobile' }, { name: 'mobile app' }];
    const res = fuzzySearch(list, 'mobile', ['name']);
    expect(res.length).toBe(2);
    expect(res[0].score).toBe(100);
    expect(res[0].matchedValue).toBe('mobile');
    expect(res[0].matchedField).toBe('name');
  });

  test('startsWith yields 75, contains yields 50, fuzzy yields 25 and sorts by score', () => {
    const custom = [
      { name: 'mobile app' }, // startsWith -> 75
      { name: 'app mobile' }, // contains -> 50
      { name: 'mibile' }, // fuzzy (one char off) -> 25
    ];

    const res = fuzzySearch(custom, 'mobile', ['name']);
    expect(res.map((r) => r.score)).toEqual([75, 50, 25]);
  });

  test('multiple fields: matches in description if name misses', () => {
    const multi: Item[] = [
      { name: 'NoMatchHere', description: 'Contains the word dashboard inside' },
    ];

    const res = fuzzySearch(multi, 'dashboard', ['name', 'description']);
    expect(res.length).toBe(1);
    expect(res[0].matchedField).toBe('description');
    expect(res[0].score).toBe(50); // contains
  });

  test('case-insensitive matching', () => {
    const res1 = fuzzySearch(items, 'dashboard', ['name']);
    const res2 = fuzzySearch(items, 'DASHBOARD', ['name']);

    // both should match the Analytics/DashBoard entries (case variations)
    expect(res1.length).toBeGreaterThan(0);
    expect(res2.length).toBeGreaterThan(0);
    expect(res1[0].score).toBe(res2[0].score);
  });

  test('typo tolerance: single edit distance matches with score 25', () => {
    const typoList = [{ name: 'dashboard' }];
    const res = fuzzySearch(typoList, 'dashbord', ['name']);
    expect(res.length).toBe(1);
    expect(res[0].score).toBe(25);
  });

  test('searchItems auto-detects fields when none provided', () => {
    const list = [{ name: 'alpha', count: 3 }, { name: 'beta', count: 2 }];
    const res = fuzzySearch(list as any, 'alpha');
    expect(res.length).toBe(1);
    expect(res[0].item.name).toBe('alpha');
  });

  test('applyFuzzySearchWithFilters applies exact filters then fuzzy search', () => {
    const items = [
      { name: 'proj1', status: 'In Progress' },
      { name: 'proj2', status: 'Done' },
      { name: 'dashboard', status: 'In Progress' },
    ];

    const res = applyFuzzySearchWithFilters(items as any, 'dashbord', { status: 'In Progress' }, ['name']);
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('dashboard');
  });

  test('searchProjects and searchTeamMembers wrappers use default fields', () => {
    const projects: any[] = [
      { name: 'API Migration', description: 'migrate', status: 'In Progress', priority: 'High' },
    ];
    const team: any[] = [
      { name: 'Alice', email: 'a@test', role: 'Dev', status: 'Active' },
    ];

    const p = searchProjects(projects as any, 'api');
    const t = searchTeamMembers(team as any, 'alice');

    expect(p.length).toBe(1);
    expect(t.length).toBe(1);
  });

  test('sorts by score and preserves tie behavior', () => {
    const mixed = [
      { name: 'api migration' }, // contains 'api' -> contains (50) but will also match start? depends
      { name: 'api' }, // exact -> 100
      { name: 'analytics api' }, // contains -> 50
    ];

    const res = fuzzySearch(mixed, 'api', ['name']);
    expect(res[0].item.name).toBe('api');
    expect(res[0].score).toBe(100);
  });

  test('normalizeString helper handles null/undefined and trimming', () => {
    expect(normalizeString(null)).toBe('');
    expect(normalizeString(undefined)).toBe('');
    expect(normalizeString('  AbC  ')).toBe('abc');
    expect(normalizeString(123)).toBe('123');
  });
});
