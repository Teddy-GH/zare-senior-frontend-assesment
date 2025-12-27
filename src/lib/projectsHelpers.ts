import type { Project } from './api';

export interface DependencyProject {
  id: number;
  name: string;
  dependencies: number[];
  estimatedDays: number;
}

/**
 * Estimate project days based on priority and progress
 */
export const estimateProjectDays = (project: Project): number => {
  let estimatedDays = 14;

  switch (project.priority) {
    case 'High':
      estimatedDays = Math.max(7, Math.min(project.tasks.total * 2, 30));
      break;
    case 'Medium':
      estimatedDays = Math.max(10, Math.min(project.tasks.total * 3, 45));
      break;
    case 'Low':
      estimatedDays = Math.max(14, Math.min(project.tasks.total * 4, 60));
      break;
  }

  if (project.tasks.total > 0) {
    const progressPercentage = project.tasks.completed / project.tasks.total;
    estimatedDays = Math.max(1, Math.ceil(estimatedDays * (1 - progressPercentage)));
  }

  return estimatedDays;
};

/**
 * Convert API projects into dependency graph format and persist/load dependencies from localStorage
 */
export const convertToDependencyFormat = (projects: Project[]): DependencyProject[] => {
  return projects.map((project) => {
    const estimatedDays = estimateProjectDays(project);

    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`project-deps-${project.id}`) : null;
    const dependencies = stored ? JSON.parse(stored) : [];

    return {
      id: project.id,
      name: project.name,
      dependencies,
      estimatedDays,
    } as DependencyProject;
  });
};

export const getProjectEstimatedDays = (dependencyProjects: DependencyProject[], projectId: number): number => {
  const p = dependencyProjects.find((d) => d.id === projectId);
  return p?.estimatedDays || 14;
};

export const getProjectDependencyCount = (dependencyProjects: DependencyProject[], projectId: number): number => {
  const p = dependencyProjects.find((d) => d.id === projectId);
  return p?.dependencies.length || 0;
};
