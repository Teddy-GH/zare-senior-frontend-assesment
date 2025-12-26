# Frontend Developer Assessment (3 Hours)
## Focus: Algorithmic Thinking & Problem-Solving

Welcome! This assessment evaluates your **problem-solving abilities** and **algorithmic thinking** in a frontend context. The basic API integration is already done - your job is to implement features that require careful algorithm design and optimization.

---

## 🎯 What We're Testing

Unlike typical frontend tests that focus on library integration, this assessment evaluates:
- **Algorithm design** and implementation
- **Data structure** usage and optimization
- **Performance** optimization thinking
- **Problem-solving** approach
- **Code quality** and maintainability

---

## 📋 Setup (Already Complete)

The application is pre-configured with:
- ✅ React + TypeScript + Vite
- ✅ React Query for API calls
- ✅ Basic filtering and searching
- ✅ Loading and error states
- ✅ shadcn/ui components

**Start the servers:**

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

Verify backend is running: http://localhost:3001/api/health

---

## 📚 Assessment Tasks

### **Part 1: Smart Search with Fuzzy Matching (60 minutes)**

**File to modify:** `src/lib/search.ts` (create this file)

Implement a **custom fuzzy search algorithm** that:

1. **Matches partial strings** with tolerance for typos (Levenshtein distance ≤ 1)
2. **Scores results** by relevance:
   - Exact match = 100 points
   - Starts with = 75 points  
   - Contains = 50 points
   - Fuzzy match (1 char off) = 25 points
3. **Returns sorted results** by score (highest first)
4. **Handles multiple fields** (search across name, description, email, role, etc.)

**Requirements:**
- ❌ Do NOT use external fuzzy search libraries (implement yourself)
- ✅ Must handle edge cases (empty strings, special chars, case insensitive)
- ✅ Must be efficient (O(n·m) where n=items, m=avg string length is acceptable)
- ✅ Include JSDoc comments explaining your algorithm
- ✅ Add unit tests or examples in comments

**Integration:**
- Add a "Smart Search" toggle to the Projects page
- When enabled, use your fuzzy search instead of basic string matching
- Show match score badge on search results

**Success Criteria:**
```typescript
// Example: searching for "moble" should match "Mobile App Redesign" (typo)
// Example: searching for "api" should match "API Migration" (exact) higher than "Analytics Dashboard" (contains)
```

**Scoring:**
- Basic fuzzy matching: 15 points
- Proper scoring system: 10 points
- Edge case handling: 5 points
- Code quality & comments: 5 points

---

### **Part 2: Team Workload Optimizer (45 minutes)**

**File to modify:** `src/pages/Analytics.tsx` (create this page) + routing

Create an Analytics page that calculates and displays:

#### A. Workload Distribution Algorithm

Implement an algorithm that:
1. **Calculates team member workload** (projects × priority weight)
   - High priority project = 3 points
   - Medium priority = 2 points
   - Low priority = 1 point
2. **Identifies imbalanced distribution** (standard deviation > 2.0)
3. **Suggests optimal reassignments** to balance workload

**Display:**
- Visual bar chart showing workload per team member
- Color-coded: Green (balanced), Yellow (busy), Red (overloaded)
- List of suggested reassignments with reasoning

#### B. Project Deadline Clustering

Implement an algorithm that:
1. **Groups projects by deadline week**
2. **Identifies "crunch weeks"** (>3 projects due same week)
3. **Calculates risk score** based on:
   - Number of projects due
   - Total team members needed
   - Priority distribution

**Display:**
- Timeline view of projects by week
- Warning badges on risky weeks
- Suggested deadline adjustments

**Requirements:**
- ✅ Use native Date objects (no date libraries)
- ✅ Handle edge cases (past deadlines, same day, etc.)
- ✅ Add complexity analysis in comments
- ✅ Create helper functions with clear names

**Scoring:**
- Workload calculation: 10 points
- Rebalancing suggestions: 10 points
- Deadline clustering: 10 points
- UI implementation: 5 points

---

### **Part 3: Dependency Graph & Critical Path (45 minutes)**

**File to modify:** `src/components/DependencyGraph.tsx` (create)

Add a "Dependencies" feature to projects:

#### A. Dependency Management

1. **Add UI** to mark projects as "blocked by" other projects
2. **Store dependencies** in component state (or add to API if time permits)
3. **Detect circular dependencies** using graph algorithms
4. **Warn user** before creating circular dependency

#### B. Critical Path Algorithm

Implement the **Critical Path Method (CPM)** to find:
1. **Longest path** through dependency chain
2. **Projects on critical path** (can't be delayed without delaying completion)
3. **Slack time** for non-critical projects

**Visualization:**
- Simple node-link diagram (can use divs + CSS)
- Highlight critical path in red
- Show estimated completion time

**Algorithm Requirements:**
- Use topological sort for dependency ordering
- Handle disconnected graphs (multiple independent chains)
- Calculate earliest start/finish times
- Calculate latest start/finish times
- Derive critical path from time calculations

**Requirements:**
- ✅ Implement graph traversal algorithm
- ✅ Handle circular dependency detection
- ✅ Add time complexity analysis
- ✅ No graph visualization libraries (use simple HTML/CSS)

**Scoring:**
- Circular dependency detection: 10 points
- Critical path algorithm: 15 points
- Visualization: 5 points

---

### **Part 4: Advanced Data Structures (30 minutes)**

**File to modify:** `src/lib/dataStructures.ts` (create)

Implement useful data structures and use them in the app:

#### A. Trie for Autocomplete

Create a **Trie data structure** for efficient prefix matching:

```typescript
class TrieNode {
  // Your implementation
}

class Trie {
  insert(word: string): void { /* ... */ }
  search(prefix: string): string[] { /* ... */ }
  // Returns all words with given prefix
}
```

**Integration:**
- Use in search bars for autocomplete suggestions
- Build from existing project/team names
- Update on data changes

#### B. LRU Cache for API Responses

Implement an **LRU (Least Recently Used) Cache**:

```typescript
class LRUCache<K, V> {
  constructor(capacity: number) { /* ... */ }
  get(key: K): V | undefined { /* ... */ }
  put(key: K, value: V): void { /* ... */ }
  // Evicts least recently used when capacity reached
}
```

**Integration:**
- Wrap API calls with LRU cache
- Show cache hit/miss statistics
- Configurable cache size

**Requirements:**
- ✅ O(1) get and put operations
- ✅ Properly maintain access order
- ✅ Handle capacity limits correctly
- ✅ Add thorough comments

**Scoring:**
- Trie implementation: 10 points
- LRU Cache implementation: 10 points
- Integration into app: 5 points

---

## 🎁 Bonus Challenges (Optional, 30 minutes)

If you finish early, tackle these for extra credit:

### Bonus 1: Virtual Scrolling (15 points)
Implement virtual scrolling for project/team lists when >50 items
- Only render visible items + buffer
- Handle smooth scrolling
- Update on scroll events

### Bonus 2: Undo/Redo System (15 points)
Implement undo/redo for all mutations
- Command pattern
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Show history panel

### Bonus 3: Debounced Search with Request Cancellation (10 points)
Implement custom debounce without lodash
- Cancel in-flight requests
- Handle race conditions
- Show loading states correctly

---

## 📝 Submission Requirements

### 1. Code Implementation
- All required features working
- Clean, well-documented code
- TypeScript types used appropriately

### 2. Algorithm Documentation (REQUIRED)

Create `ALGORITHMS.md` documenting:

```markdown
# Algorithm Analysis

## 1. Fuzzy Search
- **Time Complexity:** O(?)
- **Space Complexity:** O(?)
- **Approach:** [Explain your algorithm]
- **Trade-offs:** [What you optimized for and why]

## 2. Workload Optimizer
- **Time Complexity:** O(?)
- **Algorithm:** [Explain your approach]
- **Edge Cases Handled:** [List them]

## 3. Critical Path Method
- **Data Structure:** [What you used and why]
- **Algorithm Steps:** [Numbered list]
- **Time Complexity:** O(?)

## 4. Data Structures
- **Trie Operations:** [Complexity analysis]
- **LRU Cache:** [Implementation approach]

## Testing Approach
[How would you test these? What edge cases did you consider?]

## If I Had More Time
[What would you improve? What optimizations did you skip?]
```

### 3. Demo Instructions

In the README, add:
- What features you completed
- How to test each feature
- Any assumptions you made
- Known limitations

---

## 📊 Scoring Breakdown

| Category | Points | Emphasis |
|----------|--------|----------|
| **Part 1: Fuzzy Search** | 35 | Algorithm design, edge cases |
| **Part 2: Analytics** | 35 | Mathematical optimization |
| **Part 3: Dependencies** | 30 | Graph algorithms |
| **Part 4: Data Structures** | 25 | Implementation quality |
| **Code Quality** | 20 | Clean code, types, docs |
| **Algorithm Docs** | 15 | Clear explanations, complexity analysis |
| **Bonus Challenges** | 40 | Extra credit |
| **Total** | 160 (+40 bonus) | |

**Passing Score:** 100/160 (62.5%)  
**Strong Performance:** 130+/160 (81%+)

---

## 🎯 What We're Looking For

### ✅ Good Signs
- Custom algorithm implementations (not just library calls)
- Clear complexity analysis
- Edge case handling
- Clean, maintainable code
- Thoughtful trade-off decisions
- Good variable/function naming

### ❌ Red Flags
- Using libraries for core algorithms
- No consideration for edge cases
- Magic numbers without explanation
- Copy-pasted code without understanding
- Ignoring performance implications
- No error handling

---

## 💡 Tips

1. **Read requirements fully** before coding
2. **Start with pseudocode** for complex algorithms
3. **Test edge cases** (empty arrays, single items, duplicates)
4. **Add comments** explaining WHY, not just WHAT
5. **Measure time complexity** - add to comments
6. **Focus on correctness first**, then optimize
7. **Use TypeScript** properly (no `any` types)
8. **Keep functions small** and focused

---

## ⏱️ Time Management Suggestion

- **0-15 min:** Read all requirements, plan approach
- **15-75 min:** Part 1 - Fuzzy Search
- **75-120 min:** Part 2 - Analytics
- **120-165 min:** Part 3 - Dependencies
- **165-195 min:** Part 4 - Data Structures
- **195-210 min:** Documentation, polish, testing

**Don't worry if you don't finish everything!** We care more about:
- Quality of what you complete
- Your problem-solving approach
- How you handle complexity

---

## 🆘 Help & Clarifications

If requirements are unclear:
- Make reasonable assumptions
- Document them in comments
- Proceed with implementation

**Note:** This is an assessment of algorithmic thinking, not Google-fu. Referencing algorithms is fine, but implement them yourself and understand every line.

---

## 🚀 Getting Started

1. Create the starter files mentioned above
2. Run the servers
3. Open `src/lib/search.ts` and start with Part 1
4. Track your time for each section
5. Document as you go

**Good luck! Show us how you think through complex problems.**

