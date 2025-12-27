// src/pages/Analytics.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Label
} from 'recharts';
import { projectsApi, teamApi, Project, TeamMember } from '../lib/api'; // Adjust the import path
import {
  calculateWorkloadDistribution,
  calculateStandardDeviation,
  generateReassignmentSuggestions,
  clusterProjectsByWeek,
  formatDate,
  WorkloadData,
  ReassignmentSuggestion,
  DeadlineCluster
} from '../lib/workload';

const Analytics: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [standardDeviation, setStandardDeviation] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<ReassignmentSuggestion[]>([]);
  const [deadlineClusters, setDeadlineClusters] = useState<DeadlineCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsData, teamData] = await Promise.all([
          projectsApi.getAll(),
          teamApi.getAll()
        ]);
        
        setProjects(projectsData);
        setTeamMembers(teamData);
        
        // Calculate workload distribution
        const workloads = calculateWorkloadDistribution(teamData, projectsData);
        setWorkloadData(workloads);
        
        // Calculate standard deviation
        const stdDev = calculateStandardDeviation(workloads.map(w => w.workload));
        setStandardDeviation(stdDev);
        
        // Generate suggestions if imbalanced
        if (stdDev > 2.0) {
          const reassignments = generateReassignmentSuggestions(workloads, projectsData, teamData);
          setSuggestions(reassignments);
        }
        
        // Cluster projects by deadline week
        const clusters = clusterProjectsByWeek(projectsData);
        setDeadlineClusters(clusters);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Prepare data for workload chart
  const workloadChartData = workloadData.map(item => ({
    ...item,
    fill: item.status === 'balanced' ? '#10b981' : 
          item.status === 'busy' ? '#f59e0b' : '#ef4444'
  }));

  // Prepare data for timeline chart
  const timelineChartData = deadlineClusters.map(cluster => ({
    week: `Week of ${formatDate(cluster.weekStart)}`,
    projectCount: cluster.projectCount,
    riskScore: cluster.riskScore
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Error loading analytics</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>
      
      {/* Workload Distribution Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Workload Distribution</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Standard Deviation: <span className={`font-bold ${standardDeviation > 2.0 ? 'text-red-600' : 'text-green-600'}`}>
                {standardDeviation.toFixed(2)}
              </span>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-sm">Balanced</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span className="text-sm">Busy</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-sm">Overloaded</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Workload Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Workload per Team Member</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Workload Points', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'workload') return [`${value} points`, 'Workload'];
                    if (name === 'projectCount') return [value, 'Projects'];
                    return [value, name];
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar 
                  dataKey="workload" 
                  name="Workload Points" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="projectCount" 
                  name="Project Count" 
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Rebalancing Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Workload Rebalancing Suggestions
              <span className="ml-2 text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                Imbalance Detected (std dev {`>`} 2.0)
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">!</span>
                    </div>
                    <h4 className="font-medium text-gray-800">Reassign Project</h4>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">From: <span className="font-medium text-red-600">{suggestion.fromMember}</span></p>
                    <p className="text-sm text-gray-600 mb-1">To: <span className="font-medium text-green-600">{suggestion.toMember}</span></p>
                    <p className="text-sm text-gray-600">Project: <span className="font-medium">{suggestion.projectName}</span></p>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{suggestion.reason}</p>
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    Workload impact: {suggestion.workloadImpact} points
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      
      {/* Project Deadline Clustering Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Project Deadline Timeline</h2>
        
        {/* Timeline Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Projects per Week</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left">
                  <Label value="Project Count" angle={-90} position="insideLeft" />
                </YAxis>
                <YAxis yAxisId="right" orientation="right">
                  <Label value="Risk Score" angle={90} position="insideRight" />
                </YAxis>
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'projectCount') return [value, 'Projects'];
                    if (name === 'riskScore') return [value, 'Risk Score'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="projectCount"
                  name="Project Count"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#ff7300"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Week-by-Week Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Week-by-Week Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects Due
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Members Needed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deadlineClusters.map((cluster, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(cluster.weekStart)} - {formatDate(cluster.weekEnd)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cluster.projectCount}</div>
                      <div className="text-xs text-gray-500">
                        High: {cluster.projects.filter(p => p.priority === 'High').length}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cluster.totalMembersNeeded}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${cluster.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          cluster.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {cluster.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {cluster.riskLevel === 'high' && (
                        <button className="text-blue-600 hover:text-blue-900 font-medium">
                          Suggest Adjustments
                        </button>
                      )}
                      {cluster.projectCount > 3 && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ Crunch week detected
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Key Insights */}
          {deadlineClusters.some(c => c.projectCount > 3) && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Key Insights</h4>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                {deadlineClusters
                  .filter(c => c.projectCount > 3)
                  .map((cluster, idx) => (
                    <li key={idx}>
                      <strong>Week of {formatDate(cluster.weekStart)}:</strong> {cluster.projectCount} projects due.
                      Consider extending deadlines for lower priority projects.
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Analytics;