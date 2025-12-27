import type { Project } from './api';

/**
 * Lightweight representation of a project used by dependency UI and helpers.
 * - `dependencies` holds an array of project ids that must complete first.
 * - `estimatedDays` is the heuristic duration in calendar days (not work-days).
 */
export interface DependencyProject {
  id: number;
  name: string;
  dependencies: number[];
  estimatedDays: number;
}

/**
 * Estimate project days based on priority and current progress.
 *
 * Rules / assumptions:
 * - Estimates are heuristic and intended for rough planning only.
 * - Values are returned in calendar days.
 * - Higher priority shortens the baseline but also caps extremes.
 * - Progress reduces remaining days proportionally (simple linear model).
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
 * Convert API `Project` objects into the simpler `DependencyProject` format
 * used by the UI dependency graph. This function also attempts to read
 * user-edited dependency lists from `localStorage` under the key
 * `project-deps-<id>` so that manual adjustments survive reloads.
 *
 * Important notes:
 * - `localStorage` access is wrapped with a typeof check so the code
 *   is safe to import in non-browser test environments.
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

/**
 * Safe lookup helper: returns the estimated days for a project in the
 * dependency array or a sensible default if not found.
 */
export const getProjectEstimatedDays = (dependencyProjects: DependencyProject[], projectId: number): number => {
  const p = dependencyProjects.find((d) => d.id === projectId);
  return p?.estimatedDays || 14;
};

/**
 * Return how many dependencies a given project has (0 when unknown).
 */
export const getProjectDependencyCount = (dependencyProjects: DependencyProject[], projectId: number): number => {
  const p = dependencyProjects.find((d) => d.id === projectId);
  return p?.dependencies.length || 0;
};
