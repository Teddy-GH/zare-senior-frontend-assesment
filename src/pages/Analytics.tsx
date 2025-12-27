// src/pages/Analytics.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Label, Cell
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
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  Target,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Lightbulb,
  Clock,
  CheckCircle
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [standardDeviation, setStandardDeviation] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<ReassignmentSuggestion[]>([]);
  const [deadlineClusters, setDeadlineClusters] = useState<DeadlineCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

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
        
        setLastUpdated(new Date().toLocaleTimeString());
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Prepare data for workload chart
  const workloadChartData = workloadData.map(item => ({
    ...item,
    fill: item.status === 'balanced' ? '#10b981' : 
          item.status === 'busy' ? '#f59e0b' : '#ef4444',
    statusColor: item.status === 'balanced' ? '#10b981' : 
                 item.status === 'busy' ? '#f59e0b' : '#ef4444'
  }));

  // Prepare data for timeline chart
  const timelineChartData = deadlineClusters.map(cluster => ({
    week: `Week of ${formatDate(cluster.weekStart)}`,
    projectCount: cluster.projectCount,
    riskScore: cluster.riskScore
  }));

  // Calculate statistics
  const totalWorkload = workloadData.reduce((sum, item) => sum + item.workload, 0);
  const avgWorkload = totalWorkload / (workloadData.length || 1);
  const maxWorkload = Math.max(...workloadData.map(w => w.workload));
  const minWorkload = Math.min(...workloadData.map(w => w.workload));
  
  const totalProjects = projects.length;
  const highRiskWeeks = deadlineClusters.filter(c => c.riskLevel === 'high').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading analytics dashboard...</div>
          <p className="text-gray-500 mt-2">Crunching numbers and brewing insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-red-800 mb-2">Error loading analytics</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">Monitor team workload and project deadlines in real-time</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {workloadData.filter(w => w.status === 'balanced').length} balanced
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {projects.filter(p => p.priority === 'High').length} high priority
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Workload</p>
                  <p className="text-2xl font-bold text-gray-900">{avgWorkload.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <BarChartIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Std Dev: <span className={`font-semibold ${standardDeviation > 2.0 ? 'text-red-600' : 'text-green-600'}`}>
                  {standardDeviation.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risk Weeks</p>
                  <p className="text-2xl font-bold text-gray-900">{highRiskWeeks}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {deadlineClusters.filter(c => c.projectCount > 3).length} crunch weeks
              </div>
            </div>
          </div>
        </header>

        {/* Workload Distribution Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <BarChartIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Workload Distribution</h2>
              </div>
              <p className="text-gray-600">Monitor team capacity and identify imbalances</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Deviation:</span>
                  <span className={`text-lg font-bold ${standardDeviation > 2.0 ? 'text-red-600' : 'text-green-600'}`}>
                    {standardDeviation.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Balanced</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Busy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Overloaded</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Workload Chart Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Workload per Team Member</h3>
              <div className="text-sm text-gray-500">
                Range: {minWorkload} - {maxWorkload} points
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Workload Points', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -10,
                      style: { fill: '#6b7280', fontSize: 12 }
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'workload') return [`${value} points`, 'Workload'];
                      if (name === 'projectCount') return [value, 'Projects'];
                      return [value, name];
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar 
                    dataKey="workload" 
                    name="Workload Points" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {workloadChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.statusColor} />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="projectCount" 
                    name="Project Count" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                    fill="#93c5fd"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalWorkload}</div>
                  <div className="text-sm text-gray-600">Total Workload Points</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{avgWorkload.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Average per Member</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${maxWorkload - minWorkload > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {maxWorkload - minWorkload}
                  </div>
                  <div className="text-sm text-gray-600">Max-Min Difference</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rebalancing Suggestions */}
          {suggestions.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 rounded-lg mr-3">
                    <Lightbulb className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Workload Rebalancing Suggestions
                    </h3>
                    <p className="text-gray-600">Recommended actions to optimize team efficiency</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-yellow-50 text-yellow-800 text-sm font-medium rounded-full border border-yellow-200">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Imbalance Detected (std dev {`>`} 2.0)
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-200"
                  >
                    <div className="flex items-start mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Target className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Project Reassignment</h4>
                        <p className="text-sm text-gray-500">Suggestion #{index + 1}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">From:</span>
                        </div>
                        <span className="font-semibold text-red-600">{suggestion.fromMember}</span>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">To:</span>
                        </div>
                        <span className="font-semibold text-green-600">{suggestion.toMember}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Project:</span> {suggestion.projectName}
                      </p>
                      <p className="text-sm text-gray-600">{suggestion.reason}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Impact: {suggestion.workloadImpact} points
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Apply Suggestion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Workload is Well Balanced!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your team's workload distribution is optimal. Standard deviation is within acceptable limits.
              </p>
            </div>
          )}
        </section>
        
        {/* Project Deadline Clustering Section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <div className="p-2 bg-purple-50 rounded-lg mr-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Project Deadline Timeline</h2>
              </div>
              <p className="text-gray-600">Track upcoming deadlines and identify potential crunch weeks</p>
            </div>
            <div className="text-sm text-gray-500">
              Showing {deadlineClusters.length} weeks of data
            </div>
          </div>
          
          {/* Timeline Chart Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Projects per Week Analysis</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Project Count</span>
                <div className="w-3 h-3 bg-orange-500 rounded-full ml-4"></div>
                <span className="text-sm text-gray-600">Risk Score</span>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis yAxisId="left">
                    <Label 
                      value="Project Count" 
                      angle={-90} 
                      position="insideLeft" 
                      offset={-10}
                      style={{ fill: '#6b7280', fontSize: 12 }}
                    />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right">
                    <Label 
                      value="Risk Score" 
                      angle={90} 
                      position="insideRight" 
                      offset={-10}
                      style={{ fill: '#6b7280', fontSize: 12 }}
                    />
                  </YAxis>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => {
                      if (name === 'projectCount') return [value, 'Projects'];
                      if (name === 'riskScore') return [value, 'Risk Score'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="projectCount"
                    name="Project Count"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#8b5cf6' }}
                    activeDot={{ r: 10, fill: '#7c3aed' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="riskScore"
                    name="Risk Score"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#f97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Week-by-Week Analysis */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                  <LineChartIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Week-by-Week Analysis</h3>
              </div>
              <div className="text-sm text-gray-500">
                {deadlineClusters.filter(c => c.riskLevel === 'high').length} high-risk weeks detected
              </div>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Week Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Projects Due
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Resources Needed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deadlineClusters.map((cluster, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors ${
                        cluster.riskLevel === 'high' ? 'bg-red-50/50' :
                        cluster.riskLevel === 'medium' ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            cluster.riskLevel === 'high' ? 'bg-red-500' :
                            cluster.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(cluster.weekStart)} - {formatDate(cluster.weekEnd)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cluster.projects.length} projects scheduled
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-gray-900">{cluster.projectCount}</div>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                            High: {cluster.projects.filter(p => p.priority === 'High').length}
                          </span>
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                            Med: {cluster.projects.filter(p => p.priority === 'Medium').length}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Low: {cluster.projects.filter(p => p.priority === 'Low').length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cluster.totalMembersNeeded}</div>
                            <div className="text-xs text-gray-500">team members</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start">
                          <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full
                            ${cluster.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              cluster.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'}`}>
                            {cluster.riskLevel.toUpperCase()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Score: {cluster.riskScore.toFixed(1)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          {cluster.riskLevel === 'high' && (
                            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow">
                              Adjust Schedule
                            </button>
                          )}
                          {cluster.projectCount > 3 && (
                            <div className="flex items-center text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                              <AlertTriangle className="h-3 w-3 mr-1.5" />
                              Crunch week detected
                            </div>
                          )}
                          {cluster.projectCount <= 2 && (
                            <div className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                              Capacity available
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Key Insights */}
            {deadlineClusters.some(c => c.projectCount > 3) && (
              <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-amber-900">Key Insights & Recommendations</h4>
                </div>
                <ul className="space-y-3">
                  {deadlineClusters
                    .filter(c => c.projectCount > 3)
                    .map((cluster, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div className="text-sm text-amber-800">
                          <strong className="font-semibold">Week of {formatDate(cluster.weekStart)}:</strong> 
                          {' '} {cluster.projectCount} projects due with {cluster.totalMembersNeeded} team members needed. 
                          Consider extending deadlines for {cluster.projects.filter(p => p.priority === 'Low').length} low-priority projects.
                        </div>
                      </li>
                    ))}
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div className="text-sm text-blue-800">
                      <strong className="font-semibold">Pro Tip:</strong> 
                      {' '} Use the "Adjust Schedule" button to redistribute deadlines across less busy weeks.
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </section>
        
        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm">
            <p>Analytics Dashboard • Real-time workload monitoring • Last updated: {lastUpdated}</p>
            <p className="mt-2">Data updates automatically. Click refresh to fetch latest information.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Analytics;