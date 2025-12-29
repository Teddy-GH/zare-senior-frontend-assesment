import { useQuery } from '@tanstack/react-query';
import { teamApi, type TeamFilters, type TeamMember } from '@/lib/api';

export function useTeam(filters: TeamFilters = {}) {
  return useQuery<TeamMember[], Error>({
    queryKey: ['team', filters],
    queryFn: async ({ signal }) => {
      return await teamApi.getAll(filters, signal as AbortSignal);
    },
  });
}

export default useTeam;
