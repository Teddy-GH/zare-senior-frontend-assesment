import type { Project, TeamMember } from './api';

// Helper types
export interface WorkloadData {
  memberId: number;
  name: string;
  workload: number;
  projectCount: number;
  status: 'balanced' | 'busy' | 'overloaded';
}

export interface ReassignmentSuggestion {
  fromMember: string;
  toMember: string;
  projectName: string;
  reason: string;
  workloadImpact: number;
}

export interface DeadlineCluster {
  weekStart: Date;
  weekEnd: Date;
  projects: Project[];
  projectCount: number;
  totalMembersNeeded: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Complexity: O(n * m) where n = team members, m = projects
export const calculateWorkloadDistribution = (teamMembers: TeamMember[], projects: Project[]): WorkloadData[] => {
  const priorityWeights: Record<string, number> = {
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  const workloadMap = new Map<number, { workload: number; count: number }>();
  teamMembers.forEach(member => workloadMap.set(member.id, { workload: 0, count: 0 }));

  projects.forEach(project => {
    const weight = priorityWeights[project.priority] || 1;
    if (project.team) {
      const current = workloadMap.get(project.team);
      if (current) {
        current.workload += weight;
        current.count += 1;
      }
    }
  });

  const workloads: WorkloadData[] = [];
  workloadMap.forEach((value, memberId) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      let status: WorkloadData['status'] = 'balanced';
      if (value.workload > 8) status = 'overloaded';
      else if (value.workload > 5) status = 'busy';

      workloads.push({
        memberId,
        name: member.name,
        workload: value.workload,
        projectCount: value.count,
        status
      });
    }
  });

  return workloads;
};

// Complexity: O(n) - calculates standard deviation
export const calculateStandardDeviation = (workloads: number[]): number => {
  if (workloads.length === 0) return 0;
  const mean = workloads.reduce((sum, val) => sum + val, 0) / workloads.length;
  const variance = workloads.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / workloads.length;
  return Math.sqrt(variance);
};

// Complexity: O(n^2 * m) - evaluates simple reassignment suggestions
export const generateReassignmentSuggestions = (
  workloads: WorkloadData[],
  projects: Project[],
  teamMembers: TeamMember[]
): ReassignmentSuggestion[] => {
  const suggestions: ReassignmentSuggestion[] = [];
  const overloaded = workloads.filter(w => w.status === 'overloaded');
  const balanced = workloads.filter(w => w.status === 'balanced' && w.workload < 5);

  overloaded.forEach(overMember => {
    const memberProjects = projects.filter(project => project.team === overMember.memberId);
    balanced.forEach(balMember => {
      const candidateProject = memberProjects.find(project => project.team !== balMember.memberId);
      if (candidateProject) {
        const priorityWeight: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const weight = priorityWeight[candidateProject.priority] || 1;
        suggestions.push({
          fromMember: overMember.name,
          toMember: balMember.name,
          projectName: candidateProject.name,
          reason: `Reduce overload on ${overMember.name} and utilize ${balMember.name}'s capacity`,
          workloadImpact: weight
        });
      }
    });
  });

  return suggestions.slice(0, 3);
};

// Complexity: O(n log n) - sorting by deadline
export const clusterProjectsByWeek = (projects: Project[]): DeadlineCluster[] => {
  const clusters: DeadlineCluster[] = [];
  const validProjects = projects.filter(p => p.deadline);
  const sortedProjects = [...validProjects].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const weekMap = new Map<string, Project[]>();
  sortedProjects.forEach(project => {
    const deadline = new Date(project.deadline);
    const weekStart = getWeekStart(deadline);
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, []);
    weekMap.get(weekKey)!.push(project);
  });

  weekMap.forEach((weekProjects, weekKey) => {
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const projectCount = weekProjects.length;
    const totalMembersNeeded = weekProjects.length;

    let riskScore = 0;
    riskScore += projectCount * 2;
    riskScore += totalMembersNeeded > 5 ? 3 : 0;
    riskScore += weekProjects.filter(p => p.priority === 'High').length * 3;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 10) riskLevel = 'high';
    else if (riskScore > 5) riskLevel = 'medium';

    clusters.push({ weekStart, weekEnd, projects: weekProjects, projectCount, totalMembersNeeded, riskScore, riskLevel });
  });

  return clusters.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
};

// Helper to get start of week (Monday)
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Format date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
