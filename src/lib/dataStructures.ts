/**
 * Part 4: Advanced Data Structures
 *
 * Implement Trie and LRU Cache from scratch
 */

/**
 * Trie Node for efficient prefix searching
 */
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

/**
 * Trie (Prefix Tree) for autocomplete functionality
 *
 * Time Complexity:
 * - Insert: O(L) where L is length of the word
 * - Search: O(L) where L is length of the word
 * - StartsWith: O(L + N*M) where L is prefix length, N is number of words with prefix, M is avg word length
 *
 * Space Complexity: O(N*M) where N is number of words, M is avg word length
 */
export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Insert a word into the trie
   * @param word - Word to insert
   */
  insert(word: string): void {
    let currentNode = this.root;

    for (const char of word.toLowerCase()) {
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, new TrieNode());
      }
      currentNode = currentNode.children.get(char)!;
    }

    currentNode.isEndOfWord = true;
  }

  /**
   * Search for a complete word in the trie
   * @param word - Word to search for
   * @returns True if word exists
   */
  search(word: string): boolean {
    let currentNode = this.root;

    for (const char of word.toLowerCase()) {
      if (!currentNode.children.has(char)) {
        return false;
      }
      currentNode = currentNode.children.get(char)!;
    }

    return currentNode.isEndOfWord;
  }

  /**
   * Find all words that start with given prefix
   * @param prefix - Prefix to search for
   * @returns Array of words with this prefix
   */
  startsWith(prefix: string): string[] {
    // Navigate to the prefix node
    let currentNode = this.root;

    for (const char of prefix.toLowerCase()) {
      if (!currentNode.children.has(char)) {
        return []; // No words with this prefix
      }
      currentNode = currentNode.children.get(char)!;
    }

    // Collect all words from this node
    return this.collectWords(currentNode, prefix);
  }

  /**
   * Helper method to collect all words from a node
   * @param node - Starting node
   * @param prefix - Current prefix
   * @returns Array of complete words
   */
  private collectWords(node: TrieNode, prefix: string): string[] {
    const words: string[] = [];

    // If current node marks end of a word, add it to results
    if (node.isEndOfWord) {
      words.push(prefix);
    }

    // Recursively collect words from all children
    for (const [char, childNode] of node.children) {
      const childWords = this.collectWords(childNode, prefix + char);
      words.push(...childWords);
    }

    return words;
  }

  /**
   * Remove a word from the trie
   * @param word - Word to remove
   */
  remove(word: string): boolean {
    return this._remove(this.root, word.toLowerCase(), 0);
  }

  private _remove(node: TrieNode, word: string, depth: number): boolean {
    if (depth === word.length) {
      if (!node.isEndOfWord) {
        return false; // Word doesn't exist
      }
      node.isEndOfWord = false;

      // Return true if node has no children (can be deleted)
      return node.children.size === 0;
    }

    const char = word[depth];
    const childNode = node.children.get(char);

    if (!childNode) {
      return false; // Word doesn't exist
    }

    const shouldDeleteChild = this._remove(childNode, word, depth + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);

      // Return true if current node is not end of word and has no other children
      return !node.isEndOfWord && node.children.size === 0;
    }

    return false;
  }
}

/**
 * Doubly Linked List Node for LRU Cache
 */
class LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * LRU (Least Recently Used) Cache
 *
 * Requirements:
 * - O(1) get operation
 * - O(1) put operation
 * - Maintain access order
 * - Evict least recently used when capacity reached
 *
 * Implementation using Map + Doubly Linked List
 */
export class LRUCache<K, V> {
  private capacity: number;
  private size: number;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V>; // Most recently used
  private tail: LRUNode<K, V>; // Least recently used

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }

    this.capacity = capacity;
    this.size = 0;
    this.cache = new Map();

    // Initialize dummy head and tail nodes for easier boundary handling
    this.head = new LRUNode<K, V>(null as any, null as any);
    this.tail = new LRUNode<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Value if exists, undefined otherwise
   *
   * Time Complexity: O(1)
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      return undefined;
    }

    // Move the accessed node to the front (most recently used)
    this._moveToHead(node);

    return node.value;
  }

  /**
   * Put value into cache
   * @param key - Cache key
   * @param value - Value to cache
   *
   * Time Complexity: O(1)
   */
  put(key: K, value: V): void {
    let node = this.cache.get(key);

    if (node) {
      // Update existing node's value and move to head
      node.value = value;
      this._moveToHead(node);
      return;
    }

    // Create new node
    node = new LRUNode(key, value);
    this.cache.set(key, node);
    this._addNode(node);
    this.size++;

    // Check capacity and evict if necessary
    if (this.size > this.capacity) {
      this._evictLRU();
    }
  }

  /**
   * Remove a key from cache
   * @param key - Key to remove
   * @returns True if key was removed, false if not found
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this._removeNode(node);
    this.cache.delete(key);
    this.size--;

    return true;
  }

  /**
   * Get current size of cache
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
    this.size = 0;
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.size,
      capacity: this.capacity,
      utilization: (this.size / this.capacity) * 100,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get all cache entries in order from most to least recent
   */
  getEntries(): Array<{ key: K; value: V }> {
    const entries: Array<{ key: K; value: V }> = [];
    let currentNode = this.head.next;

    while (currentNode && currentNode !== this.tail) {
      entries.push({ key: currentNode.key, value: currentNode.value });
      currentNode = currentNode.next;
    }

    return entries;
  }

  /**
   * Add a node right after the head
   */
  private _addNode(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;

    this.head.next!.prev = node;
    this.head.next = node;
  }

  /**
   * Remove a node from the linked list
   */
  private _removeNode(node: LRUNode<K, V>): void {
    const prevNode = node.prev!;
    const nextNode = node.next!;

    prevNode.next = nextNode;
    nextNode.prev = prevNode;
  }

  /**
   * Move a node to the head (most recently used position)
   */
  private _moveToHead(node: LRUNode<K, V>): void {
    this._removeNode(node);
    this._addNode(node);
  }

  /**
   * Evict the least recently used item (tail.prev)
   */
  private _evictLRU(): void {
    const lruNode = this.tail.prev!;
    this._removeNode(lruNode);
    this.cache.delete(lruNode.key);
    this.size--;
  }
}

/**
 * Wrapper for API responses with LRU Cache
 */
export class CachedAPIClient {
  private cache: LRUCache<string, any>;
  private hitCount: number;
  private missCount: number;
  private errorCount: number;
  
  constructor(capacity: number = 100) {
    this.cache = new LRUCache<string, any>(capacity);
    this.hitCount = 0;
    this.missCount = 0;
    this.errorCount = 0;
  }

  /**
   * Fetch data with caching
   * @param url - API endpoint
   * @param options - Fetch options
   * @returns Cached or fresh data
   */
  async fetchWithCache(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = this._generateCacheKey(url, options);
    const cached = this.cache.get(cacheKey);

    if (cached !== undefined) {
      this.hitCount++;
      console.log(`Cache hit for: ${url}`);
      return cached;
    }

    this.missCount++;
    console.log(`Cache miss for: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.put(cacheKey, data);
      return data;
    } catch (error) {
      this.errorCount++;
      console.error("API fetch failed:", error);

      // Return mock data for development if API fails
      if (process.env.NODE_ENV === "development") {
        console.warn("Returning mock data for development");
        return this._getMockData(url);
      }

      throw error;
    }
  }

  /**
   * Generate mock data for development when API is unavailable
   */
  private _getMockData(url: string): any {
    // Mock data for projects API
    if (url.includes("/api/projects") || url === "/api/projects") {
      return [
        {
          id: 1,
          name: "Website Redesign",
          description:
            "Complete overhaul of company website with new design system",
          status: "In Progress",
          priority: "High",
          deadline: "2024-12-15",
          team: "Web Team",
          tasks: {
            total: 15,
            completed: 8,
          },
        },
        {
          id: 2,
          name: "Mobile App Development",
          description:
            "New cross-platform mobile application for iOS and Android",
          status: "Planning",
          priority: "High",
          deadline: "2025-03-20",
          team: "Mobile Team",
          tasks: {
            total: 20,
            completed: 0,
          },
        },
        {
          id: 3,
          name: "Database Migration",
          description:
            "Migrate from legacy database to new cloud-based solution",
          status: "Review",
          priority: "Medium",
          deadline: "2024-11-30",
          team: "DevOps",
          tasks: {
            total: 10,
            completed: 9,
          },
        },
        {
          id: 4,
          name: "User Authentication System",
          description: "Implement OAuth2 and multi-factor authentication",
          status: "In Progress",
          priority: "Medium",
          deadline: "2025-01-15",
          team: "Security Team",
          tasks: {
            total: 12,
            completed: 6,
          },
        },
        {
          id: 5,
          name: "Documentation Update",
          description: "Update all technical and user documentation",
          status: "Planning",
          priority: "Low",
          deadline: "2025-02-28",
          team: "Documentation",
          tasks: {
            total: 8,
            completed: 1,
          },
        },
        {
          id: 6,
          name: "Performance Optimization",
          description:
            "Optimize application performance and reduce loading times",
          status: "In Progress",
          priority: "Medium",
          deadline: "2024-12-10",
          team: "Performance Team",
          tasks: {
            total: 7,
            completed: 4,
          },
        },
      ];
    }

    // Default empty array for other endpoints
    return [];
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hits = this.hitCount;
    const misses = this.missCount;
    const errors = this.errorCount;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return {
      hits,
      misses,
      errors,
      total,
      hitRate: `${hitRate.toFixed(2)}%`,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.errorCount = 0;
  }

  getCache(): LRUCache<string, any> {
    return this.cache;
  }

  /**
   * Generate a unique cache key from URL and options
   */
  private _generateCacheKey(url: string, options?: RequestInit): string {
    const optionsString = options ? JSON.stringify(options) : "";
    return `${url}::${optionsString}`;
  }
}

/**
 * Integration: Trie for autocomplete in search bars
 */
export class AutocompleteService {
  private trie: Trie;

  constructor() {
    this.trie = new Trie();
  }

  /**
   * Build trie from existing data
   * @param items - Array of strings to index
   */
  build(items: string[]): void {
    items.forEach((item) => this.trie.insert(item));
  }

  /**
   * Get suggestions for a given prefix
   * @param prefix - Search prefix
   * @param limit - Maximum number of suggestions
   * @returns Array of suggestions
   */
  getSuggestions(prefix: string, limit: number = 10): string[] {
    const allMatches = this.trie.startsWith(prefix);
    return allMatches.slice(0, limit);
  }

  /**
   * Add a new item to the autocomplete index
   * @param item - Item to add
   */
  addItem(item: string): void {
    this.trie.insert(item);
  }

  /**
   * Remove an item from the autocomplete index
   * @param item - Item to remove
   */
  removeItem(item: string): boolean {
    return this.trie.remove(item);
  }

  /**
   * Check if an item exists in the index
   * @param item - Item to check
   */
  hasItem(item: string): boolean {
    return this.trie.search(item);
  }
}

/**
 * Test cases for data structures
 */
export function testDataStructures() {
  console.log("=== Testing Trie ===");
  const trie = new Trie();

  // Test insert and search
  trie.insert("apple");
  trie.insert("app");
  trie.insert("application");
  trie.insert("banana");
  trie.insert("band");

  console.log("Search 'apple':", trie.search("apple")); // true
  console.log("Search 'app':", trie.search("app")); // true
  console.log("Search 'appl':", trie.search("appl")); // false

  console.log("StartsWith 'app':", trie.startsWith("app"));
  // Expected: ["app", "apple", "application"]

  console.log("StartsWith 'ban':", trie.startsWith("ban"));
  // Expected: ["banana", "band"]

  // Test removal
  trie.remove("app");
  console.log("Search 'app' after removal:", trie.search("app")); // false
  console.log("Search 'apple' after removal:", trie.search("apple")); // true

  console.log("\n=== Testing LRU Cache ===");
  const cache = new LRUCache<string, number>(3);

  cache.put("a", 1);
  cache.put("b", 2);
  cache.put("c", 3);
  console.log("Cache after adding a,b,c:", cache.getStats());

  console.log("Get 'a':", cache.get("a")); // 1 (a is now most recent)

  cache.put("d", 4); // Should evict 'b' (least recent)
  console.log("Get 'b' after adding 'd':", cache.get("b")); // undefined
  console.log("Get 'a':", cache.get("a")); // 1 (still there)
  console.log("Get 'c':", cache.get("c")); // 3
  console.log("Get 'd':", cache.get("d")); // 4

  console.log("Cache entries in order:", cache.getEntries());
  console.log("Final cache stats:", cache.getStats());

  console.log("\n=== Testing Autocomplete Service ===");
  const autocomplete = new AutocompleteService();
  autocomplete.build([
    "apple",
    "app",
    "application",
    "banana",
    "band",
    "cat",
    "category",
  ]);

  console.log("Suggestions for 'app':", autocomplete.getSuggestions("app", 5));
  console.log("Suggestions for 'ba':", autocomplete.getSuggestions("ba", 5));
  console.log("Suggestions for 'c':", autocomplete.getSuggestions("c", 5));

  console.log("\n=== Testing Cached API Client ===");
  const cachedClient = new CachedAPIClient(2);

  // Note: These won't actually fetch without mocking
  console.log("Cache stats before:", cachedClient.getCacheStats());
}
