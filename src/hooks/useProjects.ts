import { useQuery } from '@tanstack/react-query';
import { projectsApi, type ProjectFilters, type Project } from '@/lib/api';

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery<Project[], Error>({
    queryKey: ['projects', filters],
    queryFn: async ({ signal }) => {
      return await projectsApi.getAll(filters, signal as AbortSignal);
    },
  });
}

export default useProjects;
