// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Types
export interface Project {
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

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  initials: string;
  projects: number;
  status: "Active" | "Inactive";
  avatar: string;
}

export interface ProjectFilters {
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TeamFilters {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Projects API
export const projectsApi = {
  getAll: async (filters?: ProjectFilters): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${API_BASE_URL}/projects?${params}`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  getById: async (id: number): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  },

  create: async (project: Omit<Project, 'id'>): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  update: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },
};

// Team API
export const teamApi = {
  getAll: async (filters?: TeamFilters): Promise<TeamMember[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${API_BASE_URL}/team?${params}`);
    if (!response.ok) throw new Error('Failed to fetch team members');
    return response.json();
  },

  getById: async (id: number): Promise<TeamMember> => {
    const response = await fetch(`${API_BASE_URL}/team/${id}`);
    if (!response.ok) throw new Error('Failed to fetch team member');
    return response.json();
  },

  create: async (member: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
    const response = await fetch(`${API_BASE_URL}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!response.ok) throw new Error('Failed to create team member');
    return response.json();
  },

  update: async (id: number, member: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await fetch(`${API_BASE_URL}/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!response.ok) throw new Error('Failed to update team member');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/team/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete team member');
  },
};

