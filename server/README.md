# Project Pulse Server

Express.js server providing CRUD API endpoints for the Project Pulse Dashboard frontend.

## Features

- **Projects API**: Full CRUD operations for project management
- **Team API**: Full CRUD operations for team member management
- CORS enabled for frontend integration
- In-memory data storage (can be easily replaced with a database)

## Installation

```bash
cd server
npm install
```

## Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
  - Query parameters (optional):
    - `status` - Filter by status (e.g., "In Progress", "Planning", "Review")
    - `priority` - Filter by priority (e.g., "High", "Medium", "Low")
    - `search` - Search by name or description (case-insensitive)
    - `sortBy` - Sort by field (e.g., "name", "deadline", "progress", "priority")
    - `sortOrder` - Sort order: "asc" or "desc" (default: "asc")
  - Example: `GET /api/projects?status=In Progress&priority=High&sortBy=name&sortOrder=asc`
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

**Project Schema:**
```json
{
  "id": 1,
  "name": "Project Name",
  "description": "Project description",
  "status": "In Progress" | "Planning" | "Review",
  "priority": "High" | "Medium" | "Low",
  "deadline": "Mar 15, 2024",
  "team": 5,
  "tasks": {
    "completed": 24,
    "total": 32
  }
}
```

### Team Members

- `GET /api/team` - Get all team members
  - Query parameters (optional):
    - `search` - Search by name, email, or role (case-insensitive)
    - `role` - Filter by role
    - `status` - Filter by status (e.g., "Active", "Inactive")
    - `sortBy` - Sort by field (e.g., "name", "email", "role", "projects")
    - `sortOrder` - Sort order: "asc" or "desc" (default: "asc")
  - Example: `GET /api/team?search=john&status=Active&sortBy=name`
- `GET /api/team/:id` - Get a specific team member
- `POST /api/team` - Create a new team member
- `PUT /api/team/:id` - Update a team member
- `DELETE /api/team/:id` - Delete a team member

**Team Member Schema:**
```json
{
  "id": 1,
  "name": "John Doe",
  "role": "Developer",
  "email": "john@company.com",
  "initials": "JD",
  "projects": 5,
  "status": "Active",
  "avatar": "bg-primary"
}
```

### Health Check

- `GET /api/health` - Check server status

## Example Requests

### Create a Project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Project",
    "description": "Project description",
    "status": "Planning",
    "priority": "High",
    "deadline": "Dec 31, 2024",
    "team": 3,
    "tasks": {"completed": 0, "total": 10}
  }'
```

### Update a Project
```bash
curl -X PUT http://localhost:3001/api/projects/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress",
    "tasks": {"completed": 5, "total": 10}
  }'
```

### Create a Team Member
```bash
curl -X POST http://localhost:3001/api/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "role": "Designer",
    "email": "jane@company.com",
    "projects": 3,
    "status": "Active"
  }'
```

## Notes

- Data is stored in-memory and will reset when the server restarts
- To persist data, consider integrating a database (MongoDB, PostgreSQL, etc.)
- The server includes initial seed data matching the frontend's default data

