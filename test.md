# Frontend Developer Assessment - Project Pulse Dashboard

⚠️ **NOTICE: This assessment has been updated!**

## 🔄 New Version Available

This repository now includes a **revised 3-hour assessment** that focuses on:
- ✅ Algorithmic thinking and problem-solving
- ✅ Custom algorithm implementation
- ✅ Data structures and optimization
- ✅ Better prediction of technical interview success

👉 **See `ASSESSMENT.md` and `README-ASSESSMENT.md` for the new focused assessment.**

The basic API integration, filtering, and UI work has been **pre-implemented** so candidates can focus on demonstrating algorithmic skills.

---

## Original Assessment (Below)

This was the original assessment. It's still valid, but the new version (above) is recommended for better evaluation of problem-solving skills.

Welcome! This assessment will evaluate your frontend development skills by having you implement several features for the Project Pulse Dashboard application.

## 📋 Overview

You'll be working with a React + TypeScript application that uses:
- **Vite** as the build tool
- **React Router** for routing
- **TanStack Query (React Query)** for data fetching
- **Tailwind CSS** + **shadcn/ui** for styling
- **Express.js** backend API (provided)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Step 1: Start the Backend Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3001`

4. Verify the server is running by visiting `http://localhost:3001/api/health` in your browser. You should see:
   ```json
   {"status":"ok","message":"Server is running"}
   ```

### Step 2: Start the Frontend Application

1. Open a **new terminal window** (keep the server running)

2. Navigate to the project root:
   ```bash
   cd ..  # if you're in the server directory
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## 📚 API Documentation

The backend API is available at `http://localhost:3001/api`

### Projects Endpoints

- `GET /api/projects` - Get all projects
  - Query params (optional): `status`, `priority`, `search`, `sortBy`, `sortOrder`
  - Example: `GET /api/projects?status=In Progress&sortBy=name&sortOrder=asc`
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

**Project Schema:**
```typescript
{
  id: number;
  name: string;
  description: string;
  status: "In Progress" | "Planning" | "Review";
  priority: "High" | "Medium" | "Low";
  deadline: string;
  team: number;
  tasks: {
    completed: number;
    total: number;
  };
}
```

### Team Endpoints

- `GET /api/team` - Get all team members
  - Query params (optional): `search`, `role`, `status`, `sortBy`, `sortOrder`
  - Example: `GET /api/team?search=john&sortBy=name`
- `GET /api/team/:id` - Get a specific team member
- `POST /api/team` - Create a new team member
- `PUT /api/team/:id` - Update a team member
- `DELETE /api/team/:id` - Delete a team member

**Team Member Schema:**
```typescript
{
  id: number;
  name: string;
  role: string;
  email: string;
  initials: string;
  projects: number;
  status: "Active" | "Inactive";
  avatar: string; // CSS class like "bg-primary"
}
```

## ✅ Assessment Requirements

Implement the following features. You don't need to complete everything - we'll evaluate based on how far you get and the quality of your implementation.

### 1. API Integration (Required)

- [ ] Replace hardcoded data in `src/pages/Projects.tsx` with API calls using React Query
- [ ] Replace hardcoded data in `src/pages/Team.tsx` with API calls using React Query
- [ ] Create API utility functions/services to handle all CRUD operations
- [ ] Use React Query's `useQuery` for fetching and `useMutation` for create/update/delete operations

**Tips:**
- Create a `src/lib/api.ts` or `src/services/api.ts` file for API functions
- Use React Query's built-in caching and refetching capabilities
- Handle API errors appropriately

### 2. Project Filtering (Required)

- [ ] Add filter controls to the Projects page
- [ ] Allow filtering by:
  - Status (In Progress, Planning, Review)
  - Priority (High, Medium, Low)
  - Search by project name or description
- [ ] Filters should work together (e.g., filter by status AND priority)
- [ ] Update the API call to use query parameters for filtering

**UI Suggestions:**
- Use dropdowns/selects for status and priority filters
- Add a search input field
- Show active filters and allow clearing them

### 3. Project Sorting (Required)

- [ ] Add sorting functionality to the Projects page
- [ ] Allow sorting by:
  - Name (alphabetical)
  - Deadline (date)
  - Progress percentage (calculated from tasks.completed / tasks.total)
  - Priority
- [ ] Support both ascending and descending order
- [ ] Show visual indicator of current sort (e.g., arrow icons)

**UI Suggestions:**
- Add a dropdown or button group for sort options
- Show sort direction (asc/desc) toggle
- Highlight the active sort option

### 4. Team Search Bar (Required)

- [ ] Add a search input to the Team page
- [ ] Filter team members by name in real-time as the user types
- [ ] Search should be case-insensitive
- [ ] Optionally extend search to include email and role

**UI Suggestions:**
- Place search bar at the top of the Team page
- Show "No results found" message when search yields no matches
- Consider debouncing the search input for better performance

### 5. Create Team Member Modal (Required)

- [ ] Add functionality to the "Invite Member" button on the Team page
- [ ] Create a modal/dialog form with fields:
  - Name (required)
  - Email (required, validate email format)
  - Role (required)
  - Status (default: "Active")
  - Avatar color (optional, can use a color picker or preset options)
- [ ] On submit, create the team member via API
- [ ] Show success/error feedback (toast notification)
- [ ] Refresh the team list after successful creation
- [ ] Close modal and reset form on success

**UI Suggestions:**
- Use the existing Dialog component from `@/components/ui/dialog`
- Add form validation (use react-hook-form if you want, or simple validation)
- Show loading state while submitting
- Display validation errors inline

### 6. Loading States (Required)

- [ ] Show loading indicators while fetching data
- [ ] Use skeleton loaders or spinners
- [ ] Apply to:
  - Initial page load
  - Refetching data
  - Mutations (create/update/delete)

**UI Suggestions:**
- Use React Query's `isLoading` and `isFetching` states
- Create reusable loading components
- Use the Skeleton component from `@/components/ui/skeleton`

### 7. Error States (Required)

- [ ] Handle and display API errors gracefully
- [ ] Show user-friendly error messages
- [ ] Provide retry functionality for failed requests
- [ ] Handle network errors, 404s, and 500 errors

**UI Suggestions:**
- Use Alert component from `@/components/ui/alert` for error messages
- Show a "Retry" button for failed requests
- Use React Query's `isError` and `error` states
- Consider using toast notifications for mutation errors

### 8. Bonus Features (Optional)

If you have time, consider implementing:
- [ ] Create/Edit/Delete project functionality
- [ ] Edit team member functionality
- [ ] Delete team member functionality
- [ ] Optimistic updates for better UX
- [ ] Pagination for large lists
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## 📝 Code Quality Guidelines

- Write clean, readable, and maintainable code
- Use TypeScript types/interfaces appropriately
- Follow React best practices (hooks, component composition)
- Keep components focused and reusable
- Add comments where necessary
- Use meaningful variable and function names

## 🎯 Submission Instructions

1. **Create your own repository:**
   - Fork this repository or create a new one on GitHub/GitLab
   - Push all your changes to your repository

2. **Document your work:**
   - Update this README or create a separate file documenting:
     - What you implemented
     - What you didn't get to
     - Any challenges you faced
     - How to test your features

3. **Submit your repository:**
   - Share the repository URL
   - Make sure the repository is accessible (public or shared access)
   - Include any additional setup instructions if needed

## ⏱️ Time Estimate

This assessment is designed to take **2 hours**. Focus on:
1. Quality over quantity
2. Getting the core features working well
3. Clean, maintainable code

## 🆘 Troubleshooting

### Server won't start
- Make sure port 3001 is not in use
- Check that all dependencies are installed
- Verify Node.js version is 18+

### Frontend won't connect to API
- Ensure the server is running on port 3001
- Check browser console for CORS errors
- Verify API base URL in your code

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

## 📞 Questions?

If you encounter any issues or have questions about the requirements, please reach out. Good luck!

---

**Note:** The assessment evaluates your problem-solving approach, code quality, and how far you progress. Don't worry if you don't complete everything - focus on doing what you do implement well!

