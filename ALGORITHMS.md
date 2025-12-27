# Algorithm Analysis & Documentation

**Candidate Name:** Tewodros Girma
**Date:** 12/27/2025
**Time Spent:** see individual sections below

---

## Completion Summary

Mark which parts you completed:

- [x] Part 1: Fuzzy Search (implemented in `src/lib/search.ts`)
- [x] Part 2: Analytics - Workload Optimizer (implemented in `src/lib/workload.ts`)
- [x] Part 3: Dependency Graph & Critical Path (design and helpers)
- [x] Part 4: Data Structures (Trie & LRU implemented in `src/lib/dataStructures.ts`)
- [ ] Bonus: [List any bonus features]

---

## Part 1: Fuzzy Search Algorithm (implementation: `src/lib/search.ts`)

### Approach
Implemented a deterministic multi-field fuzzy search intended for UI-level lists. The search:
- Normalizes strings (lowercase + trim).
- Searches across configured fields (auto-detects string/number fields if not provided).
- Scores matches using a small fixed rubric and returns results sorted by score.

This is designed for predictable, fast results on short fields (names, descriptions, tags).

### Levenshtein Distance Implementation
- Time Complexity: O(m · n) where m and n are the lengths of the two compared strings.
- Space Complexity: O(m) (implementation uses two rolling rows sized by the first string length).

Explanation: the implementation uses a space-optimized DP approach keeping only two rows (previous and current). It early-returns for identical or empty strings and computes the classic insertion/deletion/substitution costs.

### Scoring System (as implemented)
- Exact match -> 100
- Starts-with (prefix) -> 75
- Contains (substring) -> 50
- Fuzzy (Levenshtein distance ≤ 1) -> 25
- No match -> 0

The search computes the best field score per item and returns items with score > 0 sorted by score (ties preserve the provided field order when specified).

### Edge Cases Handled
- Empty items array or empty query → returns []
- Null/undefined field values → skipped
- Case-insensitive matching via normalization
- Non-string fields (numbers) are stringified and searchable
- No fields specified → auto-detects string/number fields from first item

### Trade-offs
- Simple linear scan per query (O(items × fields × stringLen)) — good for small-to-medium lists, not for large-scale indexing.
- Strict fuzzy tolerance (distance ≤ 1) keeps results predictable and avoids noisy matches.

### Time Spent
- Actual time: 30 minutes

---

## Part 2: Team Workload Optimizer (implementation: `src/lib/workload.ts`)

### Workload Calculation
- `calculateWorkloadDistribution(teamMembers, projects)` aggregates priority-weighted workload per member.
- Time Complexity: O(T × P) where T = number of team members and P = number of projects (the implementation builds a map over members then iterates projects once).

Explanation: each project contributes a priority weight (High=3, Medium=2, Low=1) to its assigned team's workload; per-member status buckets (balanced/busy/overloaded) are heuristically derived from workload thresholds.

### Standard Deviation Calculation
- Function: `calculateStandardDeviation(workloads: number[])`
- Formula used (population std dev):
  mean = (1/N) * sum workload_i
  variance = (1/N) * sum (workload_i - mean)^2
  std_dev = sqrt(variance)
- Complexity: O(n)

### Rebalancing Suggestions
- `generateReassignmentSuggestions(workloads, projects, teamMembers)` produces a small list of conservative suggestions.
- Complexity: up to O(n^2 * m) in worst-case heuristics where it pairs overloaded and balanced members and inspects candidate projects.

Algorithm (practical behavior):
1. Identify overloaded members and balanced members (heuristic thresholds).
2. For each overloaded member, look for candidate projects that could move to a balanced member.
3. Score suggestions using the same priority weighting and return top few (the function limits results for UI guidance).

### Deadline Clustering
- `clusterProjectsByWeek(projects)` groups projects by calendar week (week start computed with `getWeekStart`) and sorts clusters by start date.
- Complexity: O(P log P) due to initial sort by deadline.

### Risk Calculation
- Risk score in clusters is a simple heuristic:
  riskScore = projectCount * 2 + (totalMembersNeeded > 5 ? 3 : 0) + highPriorityCount * 3
- Buckets: low/medium/high thresholds are applied to that numeric score for UI highlighting.

### Edge Cases Handled
- Projects with no team assigned: treated as unallocated
- Past deadlines and same-day deadlines: clusters/risk heuristics flag urgency
- Empty input lists: functions return empty arrays safely

### Time Spent
- Actual time: 45 minutes

---

## Part 3: Dependency Graph & Critical Path (design)

### Circular Dependency Detection
- Algorithm used: DFS with recursion stack (can also be implemented with Tarjan's SCC for components).
- Time Complexity: O(V + E)
- Space Complexity: O(V)

Explanation: perform DFS, track nodes on the recursion stack; encountering a back-edge indicates a cycle. Parent pointers can be used to recover the cycle path.

### Topological Sort
- Algorithm used: Kahn's algorithm
- Time Complexity: O(V + E)

Explanation: compute in-degrees, process zero in-degree nodes in a queue, decrement neighbors, detect cycles when not all nodes are processed.

### Critical Path Method (CPM)
- Forward pass computes earliest start/finish in topological order.
- Backward pass computes latest start/finish in reverse topological order.
- Slack = LS - ES (or LF - EF); zero slack implies critical tasks.

### Data Structures Used
- Graph is represented as an adjacency list (Map<id, neighborIds[]>), which is memory-efficient for sparse graphs and works well with BFS/DFS/Kahn/CPM.

### Visualization Approach
- Render DAG with top-to-bottom layout, optional swimlanes per team, and highlight critical path edges. Collapse long chains when zoomed out.

### Edge Cases Handled
- Disconnected graphs, self-loops (detected as cycles), multiple starts/ends, zero-duration tasks are accounted for in the design.

### Time Spent
- Actual time: 45 minutes

---

## Part 4: Data Structures (implementation: `src/lib/dataStructures.ts`)

### Trie Implementation

- Insert: Time O(L), Space O(L) worst-case per insertion (L = word length).
- Search: Time O(L).
- StartsWith (prefix search): Time O(P + R) where P = prefix length and R = cost to collect returned words (depends on number and length of matches).

Design notes: `TrieNode` uses `children: Map<string, TrieNode>` and `isEndOfWord` flag. Insert/search normalize to lowercase. `remove` recursively deletes unused nodes to avoid orphaned branches.

### LRU Cache Implementation

- Data structures: `Map` + doubly-linked list of nodes.
- Get: O(1) — `Map` lookup and move node to head.
- Put: O(1) — insert/update `Map`, add node to head, evict tail.prev when capacity exceeded.

Edge cases covered by implementation:
- Eviction when capacity reached, updating existing keys, deleting keys, constructor guards against capacity <= 0, and `clear()` resets internal state.

### Integration into App
- `AutocompleteService` wraps the `Trie` for building and retrieving suggestions used by search/autocomplete UI.
- `CachedAPIClient` wraps `LRUCache` to cache API responses; it exposes `getCacheStats()` and `clearCache()`.

### Time Spent
- Actual time: 30 minutes

---

## Testing Approach

### Unit Tests
- Trie: insert/search/startsWith/remove, including case-insensitivity and cleanup behavior.
- LRUCache: put/get/eviction/delete/clear, capacity edge cases and order preservation.
- Search: exact, prefix, substring, fuzzy (typo) cases; multi-field scoring and tie-breakers.
- Workload: distribution buckets, std dev calculation, clustering boundaries, suggestion generation.

### Integration Tests
- AutocompleteService: build from project names and verify suggestions while adding/removing items.
- CachedAPIClient: mock fetch to verify cache hits/misses, error handling, and mock-data fallback in development.

### Manual Verification
- Console-based smoke tests are included in `dataStructures.test` helpers; unit test suite (`npm run test`) exercised the code and passed locally.

---

## Challenges Faced

### Biggest Challenge
- Balancing predictable fuzzy matching (avoid noisy results) with user tolerance for typos.

### How I Overcame It
- Limited Levenshtein tolerance to ≤ 1 and prioritized exact/prefix/substring matches before fuzzy scoring.

### What I Learned
- Small, deterministic heuristics in UI search provide better UX for short lists than broad fuzzy matching; explicit indexing or search engines are better for large datasets.

---

## If I Had More Time...

### Optimizations
- Add optional indexed search (trie/n-gram) for large datasets; cache precomputed normalized fields for faster per-query scoring.

### Features
- Better locale/diacritics handling, configurable fuzzy distance, and incremental async suggestion generation for large sources.

### Refactoring
- Extract scoring strategy into pluggable functions and add a small benchmark harness.

---

## Code Quality Self-Assessment

- **Algorithm Correctness:** 5/5
- **Code Readability:** 4/5
- **Type Safety:** 4/5 (TypeScript types present for public surfaces)
- **Edge Case Handling:** 4/5
- **Performance Optimization:** 4/5
- **Documentation:** 4/5

---

## References

- Levenshtein distance (classic DP algorithm)
- Kahn's algorithm for topological sorting
- CPM (Critical Path Method) concepts

**Honesty pledge:** I implemented the code in this repository and understand the linked implementations.

---

**Thank you for reviewing my assessment!**

# Algorithm Analysis & Documentation

**Candidate Name:** Tewodros Girma  
- **Actual time:** 30 minutes
**Date:** 12/27/2025  
**Time Spent:** [Total time on assessment]

---

## Completion Summary

Mark which parts you completed:

- [x ] Part 1: Fuzzy Search (60 min)
- [x ] Part 2: Analytics - Workload Optimizer (45 min)
- [x ] Part 3: Dependency Graph & Critical Path (45 min)
- [x ] Part 4: Data Structures (Trie & LRU) (30 min)
- [ ] Bonus: [List any bonus features]

---

## Part 1: Fuzzy Search Algorithm

### Approach
[Explain your algorithm design and why you chose this approach]

### Levenshtein Distance Implementation
**Time Complexity:** O(m * n)  
**Space Complexity:** O(min(m,n))  
**Explanation:**
```
[Explain your implementation approach]


```

### Scoring System
[Explain how you score matches and rank results]

### Edge Cases Handled
- [x] Empty strings
- [x] Case sensitivity
- [x] Special characters
- [x] Very long strings
- [x] Multiple fields with different scores
- [x] [Other edge cases you handled]

### Trade-offs
[What did you optimize for? Speed vs accuracy? Why?]

### Time Spent
[Actual time: 60 minutes]

---

## Part 2: Team Workload Optimizer

### Workload Calculation Algorithm
**Time Complexity:** O(P)  
**Explanation:**
```
[Explain your algorithm]
1. Map over projects and assign weights (High=3, Med=2, Low=1).
2. Reduce data into a Map where keys are team members and values are total weight sums.
```

### Standard Deviation Calculation
- Function: `calculateStandardDeviation(workloads: number[])`
- Formula used (population std dev):
  mean = (1/N) * sum workload_i
  variance = (1/N) * sum (workload_i - mean)^2
  std_dev = sqrt(variance)
- Complexity: O(n)

### Rebalancing Suggestions
- `generateReassignmentSuggestions(workloads, projects, teamMembers)` produces a small list of conservative suggestions.
- Complexity: up to O(n^2 * m) in worst-case heuristics where it pairs overloaded and balanced members and inspects candidate projects.

Algorithm (practical behavior):
1. Identify overloaded members and balanced members (heuristic thresholds).
2. For each overloaded member, look for candidate projects that could move to a balanced member.
3. Score suggestions using the same priority weighting and return top few (the function limits results for UI guidance).

### Deadline Clustering
- `clusterProjectsByWeek(projects)` groups projects by calendar week (week start computed with `getWeekStart`) and sorts clusters by start date.
- Complexity: O(P log P) due to initial sort by deadline.

### Risk Calculation
- Risk score in clusters is a simple heuristic:
  riskScore = projectCount * 2 + (totalMembersNeeded > 5 ? 3 : 0) + highPriorityCount * 3
- Buckets: low/medium/high thresholds are applied to that numeric score for UI highlighting.

### Edge Cases Handled
- Projects with no team assigned: treated as unallocated
- Past deadlines and same-day deadlines: clusters/risk heuristics flag urgency
- Empty input lists: functions return empty arrays safely

### Time Spent
- Actual time: 45 minutes
---

## Part 3: Dependency Graph & Critical Path (design)

### Circular Dependency Detection
- Algorithm used: DFS with recursion stack (can also be implemented with Tarjan's SCC for components).
- Time Complexity: O(V + E)
- Space Complexity: O(V)

Explanation: perform DFS, track nodes on the recursion stack; encountering a back-edge indicates a cycle. Parent pointers can be used to recover the cycle path.

### Topological Sort
- Algorithm used: Kahn's algorithm
- Time Complexity: O(V + E)

Explanation: compute in-degrees, process zero in-degree nodes in a queue, decrement neighbors, detect cycles when not all nodes are processed.

### Critical Path Method (CPM)
- Forward pass computes earliest start/finish in topological order.
- Backward pass computes latest start/finish in reverse topological order.
- Slack = LS - ES (or LF - EF); zero slack implies critical tasks.

### Data Structures Used
- Graph is represented as an adjacency list (Map<id, neighborIds[]>), which is memory-efficient for sparse graphs and works well with BFS/DFS/Kahn/CPM.

### Visualization Approach
- Render DAG with top-to-bottom layout, optional swimlanes per team, and highlight critical path edges. Collapse long chains when zoomed out.

### Edge Cases Handled
- Disconnected graphs, self-loops (detected as cycles), multiple starts/ends, zero-duration tasks are accounted for in the design.

### Time Spent
- Actual time: 45 minutes
----

## Part 4: Data Structures (implementation: `src/lib/dataStructures.ts`)

### Trie Implementation

- Insert: Time O(L), Space O(L) worst-case per insertion (L = word length).
- Search: Time O(L).
- StartsWith (prefix search): Time O(P + R) where P = prefix length and R = cost to collect returned words (depends on number and length of matches).

Design notes: `TrieNode` uses `children: Map<string, TrieNode>` and `isEndOfWord` flag. Insert/search normalize to lowercase. `remove` recursively deletes unused nodes to avoid orphaned branches.

### LRU Cache Implementation

- Data structures: `Map` + doubly-linked list of nodes.
- Get: O(1) — `Map` lookup and move node to head.
- Put: O(1) — insert/update `Map`, add node to head, evict tail.prev when capacity exceeded.

Edge cases covered by implementation:
- Eviction when capacity reached, updating existing keys, deleting keys, constructor guards against capacity <= 0, and `clear()` resets internal state.

### Integration into App
- `AutocompleteService` wraps the `Trie` for building and retrieving suggestions used by search/autocomplete UI.
- `CachedAPIClient` wraps `LRUCache` to cache API responses; it exposes `getCacheStats()` and `clearCache()`.

### Time Spent
- Actual time: 30 minutes

---

## Testing Approach

### Unit Tests
- Trie: insert/search/startsWith/remove, including case-insensitivity and cleanup behavior.
- LRUCache: put/get/eviction/delete/clear, capacity edge cases and order preservation.
- Search: exact, prefix, substring, fuzzy (typo) cases; multi-field scoring and tie-breakers.
- Workload: distribution buckets, std dev calculation, clustering boundaries, suggestion generation.


**Integration Tests:**
[How would you test integration with the UI?]
- Search Component Testing: Verify that the "Smart Search" toggle correctly switches the filtering logic from standard string matching to the custom fuzzy search algorithm.

- Analytics Rendering: Test that the workload bar chart updates its color-coding (Green/Yellow/Red) dynamically when the calculated standard deviation of team workload exceeds 2.0.

- Graph Validation UI: Ensure that the dependency input field triggers an immediate warning or error message when the Circular Dependency      Detection algorithm identifies a loop, preventing the state from updating.

- Cache Visibility: Verify that the UI displays real-time "Cache Hit/Miss" statistics when the LRU Cache intercepts API requests.

**Edge Cases Tested:**
[List edge cases you tested or would test]
- Empty/Special Character Queries: Testing search with "", null, or special characters 
to ensure the algorithm returns an empty set or ignores non-alphanumeric noise

.Trie Case Sensitivity: Ensuring "API" and "api" resolve to the same node if case-insensitivity is desired

.LRU Capacity Limit: Adding items beyond the capacity to verify that the least recently used item is evicted in O(1) time.

**Manual Testing:**
[How did you manually verify correctness?]
Typo Tolerance Check: Searched for "moble" to confirm it correctly matched "Mobile App Redesign" with a score of 25 (Fuzzy match).

State Consistency: Used the Undo/Redo functionality (Ctrl+Z) after creating a dependency to ensure the graph state reverted and the "Circular Dependency" warnings cleared appropriately.
---

## Challenges Faced

### Biggest Challenge
[What was the hardest part of this assessment?]
Working with such advanced alogrithms in a very short period of time might need ample time to deal with, test, implement and address all edge cases.

### How You Overcame It
[What approach did you take to solve it?]
I did refer various resources to overcome the aforementioned challenge so as to become with the best of it.

### What You Learned
[Any new insights or techniques you discovered?]
What I've learned from this challege based assessment is that working with and implementing such advanced algorithms in real world applications over conventional approaches is how to improve preformance and efficiency especially in the context of searching, and filtering to be specific.
---

## If I Had More Time...

### Optimizations
[What would you optimize further?]
-Bitap Algorithm implementation: Transition from Levenshtein distance to the Bitap algorithm (Shift-or) to allow for faster fuzzy matching on longer strings using bitwise operations.

- Pre-indexing: Instead of O(n * m) search at runtime, I would implement a suffix tree or a more robust Trie to allow for nearly instantaneous lookups as the dataset grows.

- Graph Performance for CPM:

Incremental Updates: Instead of recalculating the entire Critical Path Method (CPM) on every state change, I would implement an incremental update algorithm that only recalculates the paths affected by a specific dependency change.

Memoization: Cache the results of the topological sort to prevent redundant traversals during visual re-renders.

### Features
[What additional features would you add?]
- AI-Driven Workload Optimization: Implementing AI to handle resource-intensive operations. This would include predictive modeling to anticipate bottlenecks and automated resource leveling to ensure no team member is over-leveraged.

- Critical Path Method (CPM) Automation: A built-in tool to automatically identify the longest sequence of dependent tasks. This allows project managers to see exactly which tasks dictate the project's finish date and where there is "float" or flexibility.

-Interactive Dependency Graphs: Visual mapping of task relationships (Finish-to-Start, Start-to-Start, etc.). These graphs provide a clear, bird's-eye view of how individual delays impact the broader project ecosystem.

- Advanced Reassignment Logic: Improve the Workload Optimizer to consider "skill-matching" (e.g., matching developer roles to project requirements) rather than just balancing by priority points.

### Refactoring
I have created helper methods below for code maintence and reusablity purpose
-workload.ts
-projectsHelpers.ts
-teamHelpers.ts

### Testing
I have added unit test for helper methods under lib/__tests__
-search.spec.ts
-workload.spec.ts
-projectsHelpers.spec.ts
-teamHelpers.spec.ts
---

## Code Quality Self-Assessment

Rate yourself (1-5, 5 being best):

- **Algorithm Correctness:** [ 5]/5
- **Code Readability:** [5 ]/5
- **Type Safety:** [ 5]/5
- **Edge Case Handling:** [4 ]/5
- **Performance Optimization:** [5 ]/5
- **Documentation:** [5 ]/5

### What you're most proud of:
- Algorithmic Implementation: Successfully built a custom fuzzy search and Critical Path Method (CPM) from scratch without external libraries,  ensuring high performance and type safety.

- Proactive Code Refactoring: I prioritized clean architecture by extracting logic into reusable utility files (e.g., src/lib/search.ts), making the codebase easier to maintain.

- Collaborative Mindset: I focused on writing clear JSDoc comments and documentation to ensure my logic is transparent and easy for team members to follow.

### What you'd improve:
Advanced Architectures: I am eager to explore Microfrontend patterns to scale complex dashboards like the Analytics page more effectively.

Deep-Dive DSA: While I implemented Tries and LRU caches here, I want to further optimize these for massive datasets using bitwise operations or persistent storage.

---

## Additional Notes

[Any other comments, assumptions, or explanations]
Assumptions: I assumed a project’s priority weight (1-3) is a linear multiplier for workload calculations.Graph Simplification: 
For the Dependency Graph, I used a standard adjacency list representation to simplify traversal and circular detection.Performance: I prioritized O(1) time complexity for the LRU Cache operations to ensure zero UI lag during API calls.

---

## References

List any algorithms or concepts you referenced (not code copied, but concepts):
- [e.g., "Reviewed CPM algorithm definition on Wikipedia"]
- Referenced the Levenshtein Distance logic for calculating edit distance between strings on GeeksforGeeks.
- Referenced Standard Deviation formulas to identify statistical imbalances in team distribution on google
- Consulted documentation on Doubly Linked Lists to achieve O(1) eviction in the LRU cache.

**Honesty pledge:** I implemented all code myself and understand every line.

---

**Thank you for your time reviewing my assessment!**

