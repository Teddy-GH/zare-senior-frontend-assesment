# Algorithm Analysis & Documentation

**Candidate Name:** [Your Name]  
**Date:** [Date]  
**Time Spent:** [Total time on assessment]

---

## Completion Summary

Mark which parts you completed:

- [ ] Part 1: Fuzzy Search (60 min)
- [ ] Part 2: Analytics - Workload Optimizer (45 min)
- [ ] Part 3: Dependency Graph & Critical Path (45 min)
- [ ] Part 4: Data Structures (Trie & LRU) (30 min)
- [ ] Bonus: [List any bonus features]

---

## Part 1: Fuzzy Search Algorithm

### Approach
I implemented a deterministic, multi-field fuzzy search that balances precision and performance for UI search use-cases. The algorithm normalizes text (trim + lowercase), then for each item checks configured string fields and scores the best-matching field using a small, fixed rubric (exact, starts-with, contains, fuzzy). Fuzzy matching is limited to a strict Levenshtein distance ≤ 1 to keep results predictable and fast for short user queries.

This approach was chosen because it is simple to reason about, easy to unit test, and provides the common user expectations (exact > prefix > substring > small-typo). It is well-suited for dashboards and project listings where responsive UI is important and large-scale approximate search (e.g., full fuzzy sets, n-gram indexing) is not required.

### Levenshtein Distance Implementation
**Time Complexity:** O(m · n)  
**Space Complexity:** O(min(m, n))  
**Explanation:**

The Levenshtein implementation uses a space-optimized dynamic programming approach. Instead of allocating a full (m+1)×(n+1) matrix it keeps just two rows (previous and current), each of length n+1, where n is the length of the second string. This reduces memory to O(n) while keeping the standard O(m·n) time complexity.

High-level steps:
1. Early-return when strings are equal or one is empty.
2. Initialize the `prev` row with 0..n.
3. For each character of the first string compute the `curr` row using the three standard operations (insert, delete, substitute).
4. Swap rows and continue, returning the final distance.

The implementation intentionally returns exact distances. The search logic then treats distances of exactly 1 as a valid fuzzy hit (only if lengths differ by at most 1), which matches the strict typo-tolerance requirement.

### Scoring System
- Exact match -> 100 points
- Starts-with (prefix) -> 75 points
- Contains (substring) -> 50 points
- Fuzzy (Levenshtein distance === 1) -> 25 points
- No match -> 0 points

Results are computed per-item by checking every configured field and taking the highest-scoring field for that item. Items with score 0 are discarded. Final results are sorted by score descending (ties preserve insertion/iteration order of found items).

### Edge Cases Handled
- [x] Empty strings — empty search or missing fields yield no results; empty field values are ignored.
- [x] Case sensitivity — all comparisons use normalized lowercase text.
- [x] Special characters — characters are compared as-is after trimming and lowercasing (no aggressive tokenization); this is predictable for most UI searches.
- [x] Very long strings — algorithm is linear in number of items × fields × string lengths; Levenshtein uses reduced memory but very long strings will still increase CPU time. In practice the searchable fields are short (titles, tags, descriptions).
- [x] Multiple fields with different scores — the highest scoring field per item is used and exposed as `matchedField`/`matchType`.
- [ ] Other edge cases: diacritics, locale-specific casing, or language-specific tokenization are not specially handled.

### Trade-offs
- Optimized for predictability and speed on short to medium-length text fields (titles, short descriptions). The strict Levenshtein ≤ 1 rule keeps results deterministic and avoids noisy fuzzy matches.
- Accuracy trade-off: the fuzzy tolerance is intentionally small; this avoids returning irrelevant items for larger edit distances but will miss matches with multiple typos or transpositions.
- Scaling trade-off: this is a linear scan across items and fields (O(n·f·m)). For very large datasets an indexed approach (trie, n-gram index, or dedicated search engine) would be appropriate.

### Time Spent
- **Actual time:** 30 minutes

---

## Part 2: Team Workload Optimizer

### Workload Calculation Algorithm
**Time Complexity:** O(n log n) in the common case (dominant cost is sorting workloads), where n is the number of projects.  
**Explanation:**
```
1. Aggregate project effort per team: for each project sum estimated effort (e.g., story points or hours) and assign to its team. O(n).
2. Compute per-team workload metrics (total, count, mean). O(t) where t is number of teams.
3. Optionally sort teams by workload to create rebalancing suggestions O(t log t).
4. When selecting candidate moves, sort a team's projects by size (ascending) to pick minimal moves. This adds additional sorting cost per-team but remains bounded by project counts.
```

### Standard Deviation Calculation
**Formula Used:**
```
mean = (1/N) * sum_i workload_i
variance = (1/N) * sum_i (workload_i - mean)^2
std_dev = sqrt(variance)
```
We use population standard deviation to measure spread across teams; this helps identify whether rebalancing is needed (e.g., std_dev > threshold).

### Rebalancing Suggestions
**Algorithm:**
```
1. Compute current workload per team and target workload (mean or weighted mean).
2. Identify overloaded teams (workload > mean + tolerance) and underloaded teams (workload < mean - tolerance).
3. For each overloaded team, sort its projects by estimated effort ascending and propose moving the smallest set of projects whose sum brings the team at-or-below target, preferring moves that match skill tags or ownership preferences.
4. Validate candidate moves against constraints (team capacity, required skills, project dependencies, deadlines) and produce ranked suggestions (minimal moves first).
```

**Optimization Goal:**
Balance workloads while minimizing disruptive moves. Primary objective is to reduce standard deviation across teams; secondary objective is to minimize number of moved projects and respect constraints (skills, deadlines).

### Deadline Clustering
**Approach:**
- Parse project deadlines into dates (ISO 8601). Use UTC or project-local timezone consistently.
- Bucket deadlines by ISO week number (year + week) or by calendar week, producing weekly clusters.
- For visualization and rebalancing, treat near-term clusters (this week, next 2 weeks) as higher priority and avoid moving projects with imminent deadlines unless overloaded teams cannot be otherwise relieved.

### Risk Calculation
**Formula:**
```
// normalized components in [0,1]
progress_factor = 1 - (completed_work / estimated_total)
time_factor = clamp((threshold_days - days_until_deadline) / threshold_days, 0, 1)
dependency_factor = min(dependent_count / max_expected_dependencies, 1)

risk_score = w1*progress_factor + w2*time_factor + w3*dependency_factor
```
Weights (w1,w2,w3) are chosen based on organizational priorities (e.g., w1=0.5 progress, w2=0.3 time, w3=0.2 dependencies). The result is normalized to 0–1 and can be mapped to qualitative buckets (low/medium/high).

### Edge Cases Handled
 - [x] Projects with no team assigned — treated as unallocated; included in suggestions to assign to underloaded teams.
 - [x] Past deadlines — flagged as high-risk and excluded from non-critical rebalancing unless explicitly allowed.
 - [x] Same-day deadlines — treated as urgent and not recommended for moving.
 - [x] Empty project list — returns empty suggestions; functions handle empty inputs safely.
 - [x] Conflicting constraints (skill mismatch, dependencies) — candidate moves are validated and filtered.

### Time Spent
- **Actual time:** 45 minutes

---

## Part 3: Dependency Graph & Critical Path

### Circular Dependency Detection
**Algorithm Used:** [x] DFS [ ] BFS [ ] Other: Tarjan's SCC  
**Time Complexity:** O(V + E) where V = nodes (projects) and E = dependency edges.  
**Space Complexity:** O(V) for visited sets and recursion/stack.

**Explanation:**
```
Use a depth-first search with node coloring (white/gray/black) or an explicit recursion stack to detect back-edges. A back-edge from the current recursion path indicates a cycle (circular dependency). This approach is linear in the size of the graph and can return the cycle by tracking parent pointers or using Tarjan's SCC to find strongly connected components.
```

### Topological Sort
**Algorithm Used:** [x] Kahn's [ ] DFS-based [ ] Other: ______  
**Time Complexity:** O(V + E)

**Explanation:**
```
1. Compute in-degree for every node.
2. Start with all nodes with in-degree 0 in a queue (sources).
3. Repeatedly remove a source node, append it to the topological order, and decrement in-degree of its neighbors; when a neighbor reaches in-degree 0 push it to the queue.
4. If all nodes are processed, the order is valid; if not, the graph contains a cycle.
```

### Critical Path Method (CPM)

**Forward Pass (Earliest Times):**
```
For each node (project) with duration d:
1. Initialize earliestStart (ES) = 0 for source nodes.
2. Process nodes in topological order. For each outgoing edge to neighbor j, set neighbor.ES = max(neighbor.ES, node.ES + node.duration).
3. EarliestFinish (EF) = ES + duration.
```

**Backward Pass (Latest Times):**
```
1. Initialize latestFinish (LF) = EF of sink nodes (or project deadline) for terminal nodes.
2. Process nodes in reverse topological order. For each incoming edge from predecessor i, set predecessor.LF = min(predecessor.LF, node.LF - node.duration).
3. LatestStart (LS) = LF - duration.
```

**Critical Path Identification:**
```
Slack = LS - ES (or LF - EF). Nodes and edges with zero slack are on the critical path. The critical path is the chain of tasks where any delay increases the overall project duration.
```

### Data Structures Used
- **Graph Representation:** Adjacency list (Map<nodeId, node[]> / object keyed by id)
- **Why this choice:** Adjacency lists are memory-efficient for sparse graphs (typical project dependency graphs), allow O(1) neighbor iteration per edge, and work directly with both Kahn's algorithm and DFS. They are also easy to persist and visualize.

### Visualization Approach
Use a DAG layout (top-to-bottom) with swimlanes per team when applicable. For readability:
- Collapse long linear chains when zoomed out and expand on hover.
- Show critical path edges highlighted (red) and annotate earliest/latest times on hover.

Trade-offs: forcing compact layout can overlap labels; prioritizing clarity for critical-path nodes improves decision-making at the expense of a fully compact diagram.

### Edge Cases Handled
- [x] Disconnected graphs — algorithms handle multiple components by iterating all nodes.
- [x] Self-loops — detected as cycles during DFS and reported as invalid dependencies.
- [x] Multiple start/end nodes — handled naturally by Kahn's algorithm and CPM initialization.
- [x] Projects with no dependencies — treated as sources; included in topological order and CPM calculations.
- [x] Zero-duration tasks and parallel tasks — supported; zero-duration tasks don't affect ordering but should be validated in visualization.

### Time Spent
- **Actual time:** 45 minutes

---

## Part 4: Data Structures
### Trie Implementation

- **Insert Operation:**
	- Time Complexity: O(L)
	- Space Complexity: O(L) (worst-case per inserted word)
	- Explanation: Insertion walks/creates one node per character of the word (L = word length). New nodes are allocated only for previously unseen characters, so worst-case extra space is proportional to the word length.

- **Search Operation:**
	- Time Complexity: O(L)
	- Explanation: Search performs one `Map` lookup per character and checks the `isEndOfWord` flag at the terminal node.

- **StartsWith (Prefix Search):**
	- Time Complexity: O(P + R) where P is prefix length and R is the cost to collect results (proportional to number of matches × their lengths)
	- Explanation: Locate the node for the prefix in O(P); then recursively traverse the subtree (`collectWords`) to assemble completions — collection cost depends on how many words/characters are returned.

- **Design Decisions:**
	- Uses a `TrieNode` with `children: Map<string, TrieNode>` and an `isEndOfWord` flag for clarity and predictable iteration.
	- Uses lowercase normalization on insert/search for case-insensitive matching.
	- `Map` makes character keys safe and traversal deterministic; recursion in `collectWords` simplifies building result lists. The trie also includes a `remove` method that cleans up unused nodes.

### LRU Cache Implementation

- **Data Structure Used:**
	- [x] Map + Doubly Linked List

- **Why this choice:**
	- `Map` gives O(1) lookup from key to node; a doubly-linked list maintains recency order and supports O(1) insert/remove/move operations needed for LRU semantics.

- **Get Operation:**
	- Time Complexity: O(1)
	- Explanation: `get` does a `Map` lookup (O(1)); if present, it moves the node to the head using constant-time pointer updates and returns the value.

- **Put Operation:**
	- Time Complexity: O(1)
	- Explanation: `put` checks the `Map` (O(1)); updating an existing key updates the node and moves it to head (O(1)). Inserting a new key creates a node, inserts at head (O(1)), and if capacity is exceeded evicts the tail.prev node and deletes its `Map` entry — all constant-time operations.

- **Edge Cases Handled:**
	- [x] Cache at capacity — evicts least-recently-used via `_evictLRU()`.
	- [x] Updating existing key — updates value and moves node to most-recent position.
	- [x] Getting non-existent key — returns `undefined`.
	- [x] Zero or negative capacity — constructor throws when capacity <= 0.
	- [x] Clear/delete operations — `clear()` and `delete()` maintain size and linked-list integrity.

### Integration into App

- `Trie` is used by `AutocompleteService` (build, `getSuggestions`, `addItem`, `removeItem`, `hasItem`) for search-as-you-type suggestions.
- `LRUCache` is used by `CachedAPIClient` to cache API responses (`fetchWithCache`) and by utility methods that expose cache stats and entries.

### Time Spent

- Actual time: 30 minutes

---

## Testing Approach

### How would you test these implementations?

**Unit Tests:**
[What unit tests would you write?]

**Integration Tests:**
[How would you test integration with the UI?]

**Edge Cases Tested:**
[List edge cases you tested or would test]

**Manual Testing:**
[How did you manually verify correctness?]

---

## Challenges Faced

### Biggest Challenge
[What was the hardest part of this assessment?]

### How You Overcame It
[What approach did you take to solve it?]

### What You Learned
[Any new insights or techniques you discovered?]

---

## If I Had More Time...

### Optimizations
[What would you optimize further?]

### Features
[What additional features would you add?]

### Refactoring
[What would you refactor?]
- Time Complexity: O(L) per inserted word, where L is the word length.
- Space Complexity: O(total_chars) (worst-case O(L) extra nodes per inserted word).
- Explanation: Each inserted word walks/creates nodes per character. Inserting a word requires processing each character once, so time is proportional to the word length. Space grows by one node per new character where no shared prefix exists; shared prefixes reuse nodes.

---
- Time Complexity: O(L) for exact lookup, where L is the query length.
- Explanation: Searching for a full word follows the character path from the root; each step is O(1) map lookup per character, so overall O(L). The trie returns whether the terminal node marks a stored word.

Rate yourself (1-5, 5 being best):
- Time Complexity: O(P + R) where P is the prefix length and R is the cost to traverse and collect R matched nodes/words (proportional to the number and length of matches).
- Explanation: Locate the node for the prefix in O(P), then perform a DFS/BFS from that node to collect completions. Collection cost depends on the number of returned words and their lengths.
- **Code Readability:** [ ]/5
- **Type Safety:** [ ]/5
- **Edge Case Handling:** [ ]/5
- I use an adjacency-style node with a children Map and an `isWord` flag (and optional payload). This makes prefix operations straightforward, minimizes wasted memory via shared prefixes, and is simple to serialize. Using a Map (instead of a plain object) gives predictable iteration and safer character keys.
- **Performance Optimization:** [ ]/5
- **Documentation:** [ ]/5

### What you're most proud of:
- [x] Map + Doubly Linked List
[...] 

---
- A `Map` provides O(1) lookup of cache entries by key; a doubly-linked list maintains recency order and allows O(1) removal and insertion at head/tail for eviction. Combining both gives true O(1) `get` and `put` with capacity-based eviction.

## Additional Notes
- - Time Complexity: O(1)
- - Explanation: `get` looks up the node in the Map, moves the corresponding linked-list node to the head (O(1) pointer ops), and returns the value.

---
- - Time Complexity: O(1)
- - Explanation: `put` checks the Map (O(1)); if the key exists update value and move node to head. If inserting a new key, create a linked-list node and insert at head; if capacity exceeded, remove the tail node and delete its key from the Map — all O(1) operations.

List any algorithms or concepts you referenced (not code copied, but concepts):
- - [x] Cache at capacity — evict least-recently-used item.
- - [x] Updating existing key — overwrite and move to most-recent position.
- - [x] Getting non-existent key — return `undefined`/null safely.
- - [x] Zero capacity — treat as always-miss; optionally throw or no-op on put.
- - [x] Concurrent access (single-threaded JS) — no explicit locking required; for multi-process, external coordination is needed.
---

**Thank you for your time reviewing my assessment!**
- Tries: used for fast prefix autocomplete and local client-side suggestions (e.g., search-as-you-type for project names or tags). They can be built at app startup from project lists.
- LRU Cache: used to cache expensive computed results or API responses (search results, dependency analysis snapshots) to improve UI responsiveness while bounding memory.
# Algorithm Analysis & Documentation

**Candidate Name:** [Your Name]  
- **Actual time:** 30 minutes
**Date:** [Date]  
**Time Spent:** [Total time on assessment]

---

## Completion Summary

Mark which parts you completed:

- [ ] Part 1: Fuzzy Search (60 min)
- [ ] Part 2: Analytics - Workload Optimizer (45 min)
- [ ] Part 3: Dependency Graph & Critical Path (45 min)
- [ ] Part 4: Data Structures (Trie & LRU) (30 min)
- [ ] Bonus: [List any bonus features]

---

## Part 1: Fuzzy Search Algorithm

### Approach
[Explain your algorithm design and why you chose this approach]

### Levenshtein Distance Implementation
**Time Complexity:** O(?)  
**Space Complexity:** O(?)  
**Explanation:**
```
[Explain your implementation approach]


```

### Scoring System
[Explain how you score matches and rank results]

### Edge Cases Handled
- [ ] Empty strings
- [ ] Case sensitivity
- [ ] Special characters
- [ ] Very long strings
- [ ] Multiple fields with different scores
- [ ] [Other edge cases you handled]

### Trade-offs
[What did you optimize for? Speed vs accuracy? Why?]

### Time Spent
[Actual time: X minutes]

---

## Part 2: Team Workload Optimizer

### Workload Calculation Algorithm
**Time Complexity:** O(?)  
**Explanation:**
```
[Explain your algorithm]
1. ...
2. ...
```

### Standard Deviation Calculation
**Formula Used:**
```
[Write the formula you implemented]
```

### Rebalancing Suggestions
**Algorithm:**
```
[Explain how you determine which projects to move]
1. ...
2. ...
```

**Optimization Goal:**
[What were you trying to optimize? Minimize moves? Balance perfectly? Why?]

### Deadline Clustering
**Approach:**
[How did you group projects by week? Handle date parsing?]

### Risk Calculation
**Formula:**
```
[Explain your risk scoring formula]
```

### Edge Cases Handled
- [ ] Projects with no team assigned
- [ ] Past deadlines
- [ ] Same-day deadlines
- [ ] Empty project list
- [ ] [Other edge cases]

### Time Spent
[Actual time: X minutes]

---

## Part 3: Dependency Graph & Critical Path

### Circular Dependency Detection
**Algorithm Used:** [ ] DFS [ ] BFS [ ] Other: ______  
**Time Complexity:** O(?)  
**Space Complexity:** O(?)

**Explanation:**
```
[Explain your approach]
```

### Topological Sort
**Algorithm Used:** [ ] Kahn's [ ] DFS-based [ ] Other: ______  
**Time Complexity:** O(?)

**Explanation:**
```
[Step-by-step algorithm]
```

### Critical Path Method (CPM)

**Forward Pass (Earliest Times):**
```
[Explain calculation]
```

**Backward Pass (Latest Times):**
```
[Explain calculation]
```

**Critical Path Identification:**
```
[How do you identify critical path from slack times?]
```

### Data Structures Used
- **Graph Representation:** [Adjacency list? Matrix? Other?]
- **Why this choice:** [Justify your choice]

### Visualization Approach
[How did you visualize the graph? What trade-offs did you make?]

### Edge Cases Handled
- [ ] Disconnected graphs
- [ ] Self-loops
- [ ] Multiple start/end nodes
- [ ] Projects with no dependencies
- [ ] [Other edge cases]

### Time Spent
[Actual time: X minutes]

---

## Part 4: Data Structures

### Trie Implementation

**Insert Operation:**
- Time Complexity: O(?)
- Space Complexity: O(?)
- Explanation: [Why this complexity?]

**Search Operation:**
- Time Complexity: O(?)
- Explanation: [...]

**StartsWith (Prefix Search):**
- Time Complexity: O(?)
- Explanation: [How did you collect all words with prefix?]

**Design Decisions:**
[Why did you structure the Trie this way?]

### LRU Cache Implementation

**Data Structure Used:**
- [ ] Map only (JavaScript Map maintains insertion order)
- [ ] Map + Doubly Linked List
- [ ] Other: ______

**Why this choice:**
[Justify your implementation approach]

**Get Operation:**
- Time Complexity: O(?)
- Explanation: [How do you maintain O(1)?]

**Put Operation:**
- Time Complexity: O(?)
- Explanation: [How do you handle eviction in O(1)?]

**Edge Cases Handled:**
- [ ] Cache at capacity
- [ ] Updating existing key
- [ ] Getting non-existent key
- [ ] Zero capacity
- [ ] [Other edge cases]

### Integration into App
[How did you integrate these data structures? Where are they used?]

### Time Spent
[Actual time: X minutes]

---

## Testing Approach

### How would you test these implementations?

**Unit Tests:**
[What unit tests would you write?]

**Integration Tests:**
[How would you test integration with the UI?]

**Edge Cases Tested:**
[List edge cases you tested or would test]

**Manual Testing:**
[How did you manually verify correctness?]

---

## Challenges Faced

### Biggest Challenge
[What was the hardest part of this assessment?]

### How You Overcame It
[What approach did you take to solve it?]

### What You Learned
[Any new insights or techniques you discovered?]

---

## If I Had More Time...

### Optimizations
[What would you optimize further?]

### Features
[What additional features would you add?]

### Refactoring
[What would you refactor?]

### Testing
[What additional tests would you write?]

---

## Code Quality Self-Assessment

Rate yourself (1-5, 5 being best):

- **Algorithm Correctness:** [ ]/5
- **Code Readability:** [ ]/5
- **Type Safety:** [ ]/5
- **Edge Case Handling:** [ ]/5
- **Performance Optimization:** [ ]/5
- **Documentation:** [ ]/5

### What you're most proud of:
[...]

### What you'd improve:
[...]

---

## Additional Notes

[Any other comments, assumptions, or explanations]

---

## References

List any algorithms or concepts you referenced (not code copied, but concepts):
- [e.g., "Reviewed CPM algorithm definition on Wikipedia"]
- [...]

**Honesty pledge:** I implemented all code myself and understand every line.

---

**Thank you for your time reviewing my assessment!**

