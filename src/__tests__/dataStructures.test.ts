import { Trie, LRUCache, AutocompleteService } from '../lib/dataStructures';

describe('Trie', () => {
  test('insert, search, startsWith, remove', () => {
    const trie = new Trie();
    trie.insert('apple');
    trie.insert('app');
    trie.insert('application');

    expect(trie.search('apple')).toBe(true);
    expect(trie.search('app')).toBe(true);
    expect(trie.search('appl')).toBe(false);

    const starts = trie.startsWith('app').sort();
    expect(starts).toEqual(['app', 'apple', 'application'].sort());

    // remove 'app' and ensure others remain (remove may return false when nodes are shared)
    trie.remove('app');
    expect(trie.search('app')).toBe(false);
    expect(trie.search('apple')).toBe(true);
  });
});

describe('LRUCache', () => {
  test('put/get/evict/delete/clear', () => {
    const cache = new LRUCache<string, number>(3);
    cache.put('a', 1);
    cache.put('b', 2);
    cache.put('c', 3);

    expect(cache.getSize()).toBe(3);
    expect(cache.get('a')).toBe(1);

    // add d -> should evict least recently used (b)
    cache.put('d', 4);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.getSize()).toBe(3);

    // delete key
    expect(cache.delete('c')).toBe(true);
    expect(cache.get('c')).toBeUndefined();
    expect(cache.getSize()).toBe(2);

    // clear
    cache.clear();
    expect(cache.getSize()).toBe(0);
  });
});

describe('AutocompleteService', () => {
  test('build and suggestions limit', () => {
    const svc = new AutocompleteService();
    svc.build(['apple', 'app', 'application', 'banana', 'band', 'cat']);
    const suggestions = svc.getSuggestions('app', 2);
    expect(suggestions.length).toBe(2);
    // ensure suggestions come from trie
    expect(suggestions.every((s) => s.startsWith('app'))).toBe(true);
  });

  test('addItem, removeItem, hasItem', () => {
    const svc = new AutocompleteService();
    svc.addItem('hello');
    expect(svc.hasItem('hello')).toBe(true);
    expect(svc.removeItem('hello')).toBe(true);
    expect(svc.hasItem('hello')).toBe(false);
  });
});

describe('CachedAPIClient (partial)', () => {
  test('cache stats, fetchWithCache hit/miss behavior', async () => {
    // mock global.fetch to return JSON
    const mockJson = { hello: 'world' };
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => mockJson,
    });

    const { CachedAPIClient } = require('../lib/dataStructures');
    const client = new CachedAPIClient(2);

    const url = '/api/test';
    const res1 = await client.fetchWithCache(url);
    expect(res1).toEqual(mockJson);

    const res2 = await client.fetchWithCache(url);
    expect(res2).toEqual(mockJson);

    const stats = client.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.cacheStats.size).toBe(1);

    client.clearCache();
    const stats2 = client.getCacheStats();
    expect(stats2.cacheStats.size).toBe(0);
  });

  test('fetchWithCache propagates fetch errors', async () => {
    // force development env
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // mock fetch to throw
    // @ts-ignore
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));

    const { CachedAPIClient } = require('../lib/dataStructures');
    const client = new CachedAPIClient(2);

    await expect(client.fetchWithCache('/api/projects')).rejects.toThrow('network');

    // restore env
    process.env.NODE_ENV = prevEnv;
  });

  test('getEntries and getStats reflect LRU order', () => {
    const { LRUCache } = require('../lib/dataStructures');
    const c = new LRUCache(3);
    c.put('x', 1);
    c.put('y', 2);
    c.put('z', 3);
    // access x to make it most recent
    c.get('x');
    const entries = c.getEntries();
    expect(entries[0].key).toBe('x');
    const stats = c.getStats();
    expect(stats.keys).toContain('x');
  });
});
