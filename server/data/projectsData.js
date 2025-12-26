// In-memory storage for projects
let projects = [
  {
    id: 1,
    name: "Mobile App Redesign",
    description: "Complete overhaul of the mobile user experience",
    status: "In Progress",
    priority: "High",
    deadline: "Mar 15, 2024",
    team: 5,
    tasks: { completed: 24, total: 32 },
  },
  {
    id: 2,
    name: "API Migration",
    description: "Migrate legacy APIs to new infrastructure",
    status: "Planning",
    priority: "Medium",
    deadline: "Apr 30, 2024",
    team: 3,
    tasks: { completed: 5, total: 28 },
  },
  {
    id: 3,
    name: "Website Refresh",
    description: "Update landing page and marketing site",
    status: "In Progress",
    priority: "High",
    deadline: "Mar 25, 2024",
    team: 4,
    tasks: { completed: 18, total: 30 },
  },
  {
    id: 4,
    name: "Analytics Dashboard",
    description: "Build comprehensive analytics and reporting",
    status: "Review",
    priority: "Low",
    deadline: "Mar 10, 2024",
    team: 2,
    tasks: { completed: 22, total: 25 },
  },
  {
    id: 5,
    name: "Security Audit",
    description: "Complete security review and implementation",
    status: "Planning",
    priority: "High",
    deadline: "May 15, 2024",
    team: 6,
    tasks: { completed: 2, total: 45 },
  },
  {
    id: 6,
    name: "Documentation Update",
    description: "Refresh all technical and user documentation",
    status: "In Progress",
    priority: "Medium",
    deadline: "Apr 5, 2024",
    team: 2,
    tasks: { completed: 12, total: 20 },
  },
];

let nextId = Math.max(...projects.map(p => p.id)) + 1;

export function getProjects() {
  return projects;
}

export function getProjectById(id) {
  return projects.find(p => p.id === id);
}

export function createProject(projectData) {
  const newProject = {
    id: nextId++,
    ...projectData,
  };
  projects.push(newProject);
  return newProject;
}

export function updateProject(id, updates) {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) {
    return null;
  }
  
  projects[index] = {
    ...projects[index],
    ...updates,
    id, // Ensure ID cannot be changed
  };
  
  return projects[index];
}

export function deleteProject(id) {
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) {
    return false;
  }
  
  projects.splice(index, 1);
  return true;
}

