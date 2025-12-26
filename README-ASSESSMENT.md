# Frontend Developer Assessment - Getting Started

## 🎯 Goal

This is a **3-hour assessment** focusing on **algorithmic thinking** and **problem-solving** in a frontend context. Unlike typical React tests, you'll implement custom algorithms and data structures.

---

## ⚡ Quick Start (5 minutes)

### 1. Start Backend Server

```bash
cd server
npm install
npm run dev
```

✅ Verify: Visit http://localhost:3001/api/health (should see `{"status":"ok"}`)

### 2. Start Frontend (New Terminal)

```bash
npm install
npm run dev
```

✅ Verify: Open http://localhost:5173

---

## 📖 What's Already Done (No Need to Implement)

We've pre-built the foundation so you can focus on algorithms:

✅ **API Integration** - React Query setup with full CRUD  
✅ **UI Components** - shadcn/ui components ready to use  
✅ **Filtering & Search** - Basic implementations working  
✅ **Loading & Error States** - Already handled  
✅ **Routing** - React Router configured  

---

## 📝 What You Need to Implement

Read **`ASSESSMENT.md`** for full details. Here's the overview:

### Part 1: Fuzzy Search (60 min) - 35 points
**File:** `src/lib/search.ts`

Implement custom fuzzy search with:
- Levenshtein distance calculation
- Relevance scoring (exact > starts-with > contains > fuzzy)
- Multi-field searching

### Part 2: Analytics Dashboard (45 min) - 35 points
**File:** `src/pages/Analytics.tsx`

Implement workload optimizer:
- Calculate team workload by priority weights
- Detect imbalanced distribution
- Suggest optimal reassignments
- Cluster projects by deadline week
- Calculate risk scores

### Part 3: Dependency Graph (45 min) - 30 points
**File:** `src/components/DependencyGraph.tsx`

Implement Critical Path Method:
- Detect circular dependencies (graph traversal)
- Topological sort
- Calculate earliest/latest start times
- Find critical path

### Part 4: Data Structures (30 min) - 25 points
**File:** `src/lib/dataStructures.ts`

Implement from scratch:
- **Trie** for autocomplete (O(1) operations)
- **LRU Cache** for API responses

### Bonus (Optional) - 40 points
- Virtual scrolling
- Undo/Redo system
- Advanced debouncing

---

## 📊 Scoring

**Total: 160 points (+ 40 bonus)**

- Algorithms: 125 points
- Code Quality: 20 points
- Documentation: 15 points

**Passing:** 100/160 (62.5%)  
**Strong:** 130+/160 (81%+)

---

## 📚 Files You'll Work With

### Create These Files:
```
src/
├── lib/
│   ├── search.ts          ← Part 1 (template provided)
│   └── dataStructures.ts  ← Part 4 (template provided)
├── pages/
│   └── Analytics.tsx      ← Part 2 (template provided)
└── components/
    └── DependencyGraph.tsx ← Part 3 (template provided)
```

### Modify These Files:
```
src/pages/Projects.tsx     ← Integrate fuzzy search
src/App.tsx                ← Already updated with routes
```

---

## 🎯 What We're Testing

### ✅ We Want to See:
- Custom algorithm implementations
- Complexity analysis (Big O)
- Edge case handling
- Clean, well-documented code
- Problem-solving approach
- TypeScript usage

### ❌ Red Flags:
- Using libraries for core algorithms
- No consideration of edge cases
- Copy-pasted code without understanding
- Missing complexity analysis
- Poor variable naming

---

## ⏱️ Time Management

```
00:00-00:15  Read requirements, plan approach
00:15-01:15  Part 1: Fuzzy Search
01:15-02:00  Part 2: Analytics
02:00-02:45  Part 3: Dependencies
02:45-03:15  Part 4: Data Structures
03:15-03:30  Documentation & polish
```

**Don't worry if you don't finish!** Focus on:
- Quality over quantity
- Understanding over completion
- Correctness over optimization

---

## 📝 Submission Requirements

### 1. Code (Primary Deliverable)
- Implement as many parts as possible
- Add JSDoc comments
- Include complexity analysis in comments

### 2. Documentation (REQUIRED)
Fill out **`ALGORITHMS.md`** with:
- Algorithm explanations
- Complexity analysis
- Trade-off discussions
- Edge cases handled
- Testing approach

### 3. Demo Instructions
Update this README with:
- What you completed
- How to test features
- Any assumptions made

---

## 💡 Tips for Success

1. **Read everything first** - Understand all requirements before coding
2. **Start with pseudocode** - Plan your algorithm before implementing
3. **Test edge cases** - Empty arrays, single items, duplicates, etc.
4. **Document as you go** - Don't leave documentation for the end
5. **Use TypeScript properly** - Avoid `any`, use proper types
6. **Commit frequently** - Show your thought process

### Common Edge Cases to Consider:
- Empty input arrays
- Single item in array
- Duplicate values
- Null/undefined values
- Very large datasets
- Special characters in strings

---

## 🆘 Need Help?

### If Requirements Are Unclear:
1. Make a reasonable assumption
2. Document it in comments
3. Proceed with implementation

### If You're Stuck:
1. Move to the next part
2. Come back if time permits
3. Partial credit is given

### If You Finish Early:
1. Tackle bonus challenges
2. Refactor code for readability
3. Add more edge case handling
4. Improve documentation

---

## 📁 Project Structure

```
project-pulse-dashboard/
├── src/
│   ├── components/       # UI components
│   ├── lib/             # Utilities & algorithms ← Your work here
│   ├── pages/           # Page components ← Your work here
│   └── hooks/           # Custom hooks
├── server/              # Express backend (provided)
│   ├── routes/          # API routes
│   └── data/            # Mock data
├── ASSESSMENT.md        # Full requirements ← Read this!
└── ALGORITHMS.md        # Your documentation ← Fill this!
```

---

## 🔍 Evaluation Criteria

Your assessment will be evaluated on:

### Algorithm Design (40%)
- Correctness of implementation
- Appropriate algorithm choice
- Handling of edge cases
- Efficiency considerations

### Code Quality (30%)
- Clean, readable code
- Meaningful names
- TypeScript usage
- DRY principle

### Documentation (20%)
- Clear explanations
- Complexity analysis
- Trade-off discussions
- Testing approach

### Problem-Solving (10%)
- How you approached problems
- Debugging process (commit history)
- Creativity in solutions

---

## 🚀 Ready to Start?

1. ✅ Read **`ASSESSMENT.md`** thoroughly
2. ✅ Verify servers are running
3. ✅ Open `src/lib/search.ts` 
4. ✅ Set a timer for 3 hours
5. ✅ Start coding!

**Good luck! Show us how you think through complex problems.** 🎯

---

## 📦 Tech Stack Reference

Already configured for you:

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Query** - API state management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icons

You don't need to learn these - focus on algorithms!

---

## Questions?

If you have clarifying questions about requirements:
1. Document your assumption in code comments
2. Proceed with your best interpretation
3. Note it in ALGORITHMS.md

**Remember:** We're testing problem-solving, not mind-reading!

