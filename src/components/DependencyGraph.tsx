/**
 * Part 3: Dependency Graph & Critical Path Method
 * 
 * Implementation of dependency management and CPM algorithm
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: number;
  name: string;
  dependencies: number[]; // Array of project IDs this depends on
  estimatedDays: number;
  color?: string; // Optional color for visualization
}

interface ProjectTimes {
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  slack: number; // Slack time (ls - es)
  isCritical: boolean; // Whether project is on critical path
}

/**
 * Detect if adding a dependency would create a cycle
 * 
 * Complexity: O(V + E) where V is vertices and E is edges (DFS traversal)
 * Algorithm:
 * 1. Temporarily add the edge from -> to
 * 2. Perform DFS from 'to'
 * 3. If we can reach 'from', there's a cycle
 */
export function detectCycle(
  projects: Project[],
  fromId: number,
  toId: number
): boolean {
  // Build adjacency list
  const graph = new Map<number, number[]>();
  
  // Initialize with existing dependencies
  projects.forEach(project => {
    graph.set(project.id, [...project.dependencies]);
  });
  
  // Temporarily add the new edge
  if (!graph.has(fromId)) {
    graph.set(fromId, []);
  }
  graph.get(fromId)!.push(toId);
  
  // Helper function for DFS cycle detection
  const hasCycleDFS = (nodeId: number, visited: Set<number>, recursionStack: Set<number>): boolean => {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }
    
    if (visited.has(nodeId)) {
      return false;
    }
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycleDFS(neighbor, visited, recursionStack)) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  };
  
  // Check for cycles starting from the 'to' node
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  
  return hasCycleDFS(toId, visited, recursionStack);
}

/**
 * Perform topological sort on projects using Kahn's algorithm
 * 
 * Complexity: O(V + E) where V is vertices and E is edges
 * Kahn's Algorithm:
 * 1. Find all nodes with no incoming edges
 * 2. Remove a node with no incoming edges
 * 3. Remove all edges from this node
 * 4. Repeat until all nodes processed
 * 5. If can't process all nodes, there's a cycle
 */
export function topologicalSort(projects: Project[]): number[] | null {
  // Build adjacency list and indegree count
  const graph = new Map<number, number[]>();
  const indegree = new Map<number, number>();
  
  // Initialize
  projects.forEach(project => {
    graph.set(project.id, [...project.dependencies]);
    indegree.set(project.id, 0);
  });
  
  // Calculate indegree for each node
  projects.forEach(project => {
    project.dependencies.forEach(depId => {
      indegree.set(depId, (indegree.get(depId) || 0) + 1);
    });
  });
  
  // Find nodes with zero indegree
  const queue: number[] = [];
  indegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  const sorted: number[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);
    
    // Get successors and reduce their indegree
    const successors = graph.get(nodeId) || [];
    successors.forEach(successorId => {
      const newIndegree = (indegree.get(successorId) || 1) - 1;
      indegree.set(successorId, newIndegree);
      
      if (newIndegree === 0) {
        queue.push(successorId);
      }
    });
  }
  
  // Check if all nodes were processed (no cycles)
  if (sorted.length !== projects.length) {
    return null; // Cycle detected
  }
  
  return sorted;
}

/**
 * Calculate earliest start/finish times for each project
 * 
 * Complexity: O(V + E) where V is vertices and E is edges
 * Forward pass of CPM:
 * 1. Process projects in topological order
 * 2. ES(start node) = 0
 * 3. ES(node) = max(EF of all predecessors)
 * 4. EF(node) = ES(node) + duration
 */
export function calculateEarliestTimes(
  projects: Project[],
  topoOrder: number[]
): Map<number, ProjectTimes> {
  const times = new Map<number, ProjectTimes>();
  
  // Create project map for easy lookup
  const projectMap = new Map<number, Project>();
  projects.forEach(p => projectMap.set(p.id, p));
  
  // Forward pass: Calculate ES and EF
  for (const projectId of topoOrder) {
    const project = projectMap.get(projectId)!;
    
    // If no dependencies, ES = 0
    if (project.dependencies.length === 0) {
      times.set(projectId, {
        es: 0,
        ef: project.estimatedDays,
        ls: 0,
        lf: 0,
        slack: 0,
        isCritical: false
      });
    } else {
      // ES = max(EF of all predecessors)
      let maxEf = 0;
      for (const depId of project.dependencies) {
        const depTimes = times.get(depId);
        if (depTimes && depTimes.ef > maxEf) {
          maxEf = depTimes.ef;
        }
      }
      
      times.set(projectId, {
        es: maxEf,
        ef: maxEf + project.estimatedDays,
        ls: 0,
        lf: 0,
        slack: 0,
        isCritical: false
      });
    }
  }
  
  return times;
}

/**
 * Calculate latest start/finish times for each project
 * 
 * Complexity: O(V + E) where V is vertices and E is edges
 * Backward pass of CPM:
 * 1. Process projects in reverse topological order
 * 2. LF(end node) = EF(end node)
 * 3. LF(node) = min(LS of all successors)
 * 4. LS(node) = LF(node) - duration
 * 5. Slack = LS - ES
 */
export function calculateLatestTimes(
  projects: Project[],
  topoOrder: number[],
  earliestTimes: Map<number, ProjectTimes>
): Map<number, ProjectTimes> {
  const times = new Map<number, ProjectTimes>(Array.from(earliestTimes.entries()));
  
  // Create project map and reverse adjacency list for backward pass
  const projectMap = new Map<number, Project>();
  const reverseGraph = new Map<number, number[]>(); // Successor list
  
  projects.forEach(p => {
    projectMap.set(p.id, p);
    reverseGraph.set(p.id, []);
  });
  
  // Build reverse graph (who depends on me)
  projects.forEach(p => {
    p.dependencies.forEach(depId => {
      if (!reverseGraph.has(depId)) {
        reverseGraph.set(depId, []);
      }
      reverseGraph.get(depId)!.push(p.id);
    });
  });
  
  // Find project with maximum EF (project end)
  let maxEf = 0;
  times.forEach(time => {
    if (time.ef > maxEf) {
      maxEf = time.ef;
    }
  });
  
  // Backward pass in reverse topological order
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const projectId = topoOrder[i];
    const project = projectMap.get(projectId)!;
    const currentTime = times.get(projectId)!;
    
    // Find successors
    const successors = reverseGraph.get(projectId) || [];
    
    if (successors.length === 0) {
      // No successors - this is an end project
      currentTime.lf = maxEf;
      currentTime.ls = maxEf - project.estimatedDays;
    } else {
      // LF = min(LS of all successors)
      let minLs = Infinity;
      for (const succId of successors) {
        const succTime = times.get(succId);
        if (succTime && succTime.ls < minLs) {
          minLs = succTime.ls;
        }
      }
      currentTime.lf = minLs;
      currentTime.ls = minLs - project.estimatedDays;
    }
    
    // Calculate slack
    currentTime.slack = currentTime.ls - currentTime.es;
    currentTime.isCritical = currentTime.slack === 0;
    
    times.set(projectId, currentTime);
  }
  
  return times;
}

/**
 * Find the critical path (projects with zero slack)
 * 
 * Complexity: O(V) where V is vertices
 * Critical path = all projects where slack = 0
 * Returns path in order from start to end
 */
export function findCriticalPath(
  projects: Project[],
  times: Map<number, ProjectTimes>
): number[] {
  // Get critical projects
  const criticalProjects = Array.from(times.entries())
    .filter(([_, time]) => time.isCritical)
    .map(([id, _]) => id);
  
  // We need to sort critical projects in topological order
  const projectMap = new Map<number, Project>();
  projects.forEach(p => projectMap.set(p.id, p));
  
  // Build adjacency list for critical projects only
  const criticalGraph = new Map<number, number[]>();
  criticalProjects.forEach(id => {
    const project = projectMap.get(id)!;
    criticalGraph.set(id, project.dependencies.filter(depId => 
      criticalProjects.includes(depId)
    ));
  });
  
  // Perform topological sort on critical subgraph
  const indegree = new Map<number, number>();
  criticalProjects.forEach(id => indegree.set(id, 0));
  
  criticalGraph.forEach((deps, nodeId) => {
    deps.forEach(depId => {
      indegree.set(depId, (indegree.get(depId) || 0) + 1);
    });
  });
  
  const queue: number[] = [];
  indegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  const criticalPathOrder: number[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    criticalPathOrder.push(nodeId);
    
    const successors = criticalGraph.get(nodeId) || [];
    successors.forEach(succId => {
      const newIndegree = (indegree.get(succId) || 1) - 1;
      indegree.set(succId, newIndegree);
      
      if (newIndegree === 0) {
        queue.push(succId);
      }
    });
  }
  
  return criticalPathOrder;
}

/**
 * Calculate total project duration
 */
function calculateTotalDuration(times: Map<number, ProjectTimes>): number {
  let maxEf = 0;
  times.forEach(time => {
    if (time.ef > maxEf) {
      maxEf = time.ef;
    }
  });
  return maxEf;
}

/**
 * Generate random color for project visualization
 */
function generateProjectColor(id: number): string {
  const hue = (id * 137.508) % 360; // Golden angle approximation
  return `hsl(${hue}, 70%, 60%)`;
}

interface DependencyGraphProps {
  projects: Project[];
  onDependencyAdd?: (fromId: number, toId: number) => void;
  onDependencyRemove?: (projectId: number, dependencyId: number) => void;
}

export default function DependencyGraph({ 
  projects, 
  onDependencyAdd,
  onDependencyRemove 
}: DependencyGraphProps) {
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [selectedTo, setSelectedTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Add colors to projects for visualization
  const projectsWithColors = useMemo(() => {
    return projects.map(project => ({
      ...project,
      color: generateProjectColor(project.id)
    }));
  }, [projects]);

  // Calculate CPM
  const sortedProjects = topologicalSort(projectsWithColors);
  const hasCycle = sortedProjects === null;
  
  const times = useMemo(() => {
    if (!sortedProjects) return null;
    const earliestTimes = calculateEarliestTimes(projectsWithColors, sortedProjects);
    return calculateLatestTimes(projectsWithColors, sortedProjects, earliestTimes);
  }, [projectsWithColors, sortedProjects]);

  const criticalPath = useMemo(() => {
    if (!times) return [];
    return findCriticalPath(projectsWithColors, times);
  }, [projectsWithColors, times]);

  const totalDuration = useMemo(() => {
    if (!times) return 0;
    return calculateTotalDuration(times);
  }, [times]);

  const handleAddDependency = () => {
    if (!selectedFrom || !selectedTo) {
      setError("Please select both projects");
      return;
    }

    if (selectedFrom === selectedTo) {
      setError("A project cannot depend on itself");
      return;
    }

    // Check if dependency already exists
    const fromProject = projects.find(p => p.id === selectedFrom);
    if (fromProject?.dependencies.includes(selectedTo)) {
      setError("This dependency already exists");
      return;
    }

    // Check for circular dependency
    if (detectCycle(projects, selectedFrom, selectedTo)) {
      setError("Cannot add dependency: would create a circular dependency!");
      return;
    }

    setError(null);
    onDependencyAdd?.(selectedFrom, selectedTo);
    setSelectedFrom(null);
    setSelectedTo(null);
  };

  const handleRemoveDependency = (projectId: number, dependencyId: number) => {
    onDependencyRemove?.(projectId, dependencyId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Project Dependencies & Critical Path
          </CardTitle>
          {totalDuration > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Total Duration: {totalDuration} days
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Dependency UI */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-4">Add New Dependency</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1.5 block">
                Project that depends on...
              </label>
              <Select
                value={selectedFrom?.toString() || ""}
                onValueChange={(v) => {
                  setSelectedFrom(parseInt(v));
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsWithColors.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center p-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-1.5 block">
                Is blocked by...
              </label>
              <Select
                value={selectedTo?.toString() || ""}
                onValueChange={(v) => {
                  setSelectedTo(parseInt(v));
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dependency" />
                </SelectTrigger>
                <SelectContent>
                  {projectsWithColors
                    .filter(p => p.id !== selectedFrom)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAddDependency}
              disabled={!selectedFrom || !selectedTo}
            >
              Add Dependency
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Critical Path Information */}
        {hasCycle ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Circular dependency detected! The project network contains a cycle.
              Please remove dependencies to create a valid directed acyclic graph (DAG).
            </AlertDescription>
          </Alert>
        ) : criticalPath.length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Critical Path Found!</span>
                <span>
                  Longest path: {criticalPath.map(id => 
                    projects.find(p => p.id === id)?.name
                  ).join(" → ")}
                </span>
                <span className="text-sm">
                  These {criticalPath.length} projects cannot be delayed without affecting total duration.
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Dependency Visualization */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Dependency Network</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-xs">Critical Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-gray-400"></div>
                <span className="text-xs">Non-Critical</span>
              </div>
            </div>
          </div>
          
          {/* Graph Visualization */}
          <div className="min-h-[400px] relative">
            {/* Draw dependency lines */}
            {projectsWithColors.map(project => {
              const projectTimes = times?.get(project.id);
              return project.dependencies.map(depId => {
                const dependency = projects.find(p => p.id === depId);
                if (!dependency) return null;
                
                const fromIndex = projects.findIndex(p => p.id === depId);
                const toIndex = projects.findIndex(p => p.id === project.id);
                const isCriticalEdge = projectTimes?.isCritical && 
                  times?.get(depId)?.isCritical && 
                  criticalPath.includes(project.id) && 
                  criticalPath.includes(depId);
                
                return (
                  <svg
                    key={`${depId}-${project.id}`}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  >
                    <defs>
                      <marker
                        id={`arrow-${depId}-${project.id}`}
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" 
                          fill={isCriticalEdge ? "#ef4444" : "#9ca3af"} />
                      </marker>
                    </defs>
                    <line
                      x1={`${(fromIndex + 1) * 25}%`}
                      y1="80px"
                      x2={`${(toIndex + 1) * 25}%`}
                      y2="80px"
                      stroke={isCriticalEdge ? "#ef4444" : "#9ca3af"}
                      strokeWidth="2"
                      strokeDasharray={isCriticalEdge ? "none" : "5,5"}
                      markerEnd={`url(#arrow-${depId}-${project.id})`}
                    />
                    <line
                      x1={`${(fromIndex + 1) * 25}%`}
                      y1="80px"
                      x2={`${(fromIndex + 1) * 25}%`}
                      y2="120px"
                      stroke={isCriticalEdge ? "#ef4444" : "#9ca3af"}
                      strokeWidth="2"
                      strokeDasharray={isCriticalEdge ? "none" : "5,5"}
                    />
                    <line
                      x1={`${(toIndex + 1) * 25}%`}
                      y1="80px"
                      x2={`${(toIndex + 1) * 25}%`}
                      y2="120px"
                      stroke={isCriticalEdge ? "#ef4444" : "#9ca3af"}
                      strokeWidth="2"
                      strokeDasharray={isCriticalEdge ? "none" : "5,5"}
                    />
                  </svg>
                );
              });
            })}

            {/* Project Nodes */}
            <div className="grid grid-cols-4 gap-4 pt-16">
              {projectsWithColors.map((project, index) => {
                const projectTimes = times?.get(project.id);
                const isCritical = projectTimes?.isCritical || false;
                const hasSlack = projectTimes && projectTimes.slack > 0;
                
                return (
                  <div 
                    key={project.id}
                    className={`col-span-1 flex flex-col items-center ${
                      selectedProject === project.id ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ 
                      gridColumn: `${(index % 4) + 1} / span 1`,
                      marginTop: `${Math.floor(index / 4) * 200}px`
                    }}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    {/* Project Node */}
                    <div 
                      className={`w-full p-4 rounded-lg border-2 shadow-sm transition-all cursor-pointer ${
                        isCritical 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="font-medium truncate">
                            {project.name}
                          </span>
                        </div>
                        {isCritical && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-semibold">{project.estimatedDays}d</span>
                        </div>
                        
                        {projectTimes && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ES/EF:</span>
                              <span>{projectTimes.es}/{projectTimes.ef}d</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">LS/LF:</span>
                              <span>{projectTimes.ls}/{projectTimes.lf}d</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Slack:</span>
                              <span className={hasSlack ? 'text-green-600 font-semibold' : 'font-semibold'}>
                                {projectTimes.slack}d
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Dependencies */}
                      {project.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs text-muted-foreground mb-1">
                            Depends on:
                          </div>
                          <div className="space-y-1">
                            {project.dependencies.map(depId => {
                              const depProject = projects.find(p => p.id === depId);
                              return depProject ? (
                                <div 
                                  key={depId}
                                  className="flex items-center justify-between p-1 text-xs bg-gray-50 rounded"
                                >
                                  <div className="flex items-center gap-1">
                                    <div 
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: generateProjectColor(depId) }}
                                    />
                                    <span className="truncate">{depProject.name}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveDependency(project.id, depId);
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Node connector line */}
                    <div className="h-8 w-1 bg-gray-300"></div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Project Statistics */}
          {times && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3">Project Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-red-600">
                    {criticalPath.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Critical Projects
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold">
                    {totalDuration}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Days
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold text-green-600">
                    {projects.filter(p => {
                      const time = times.get(p.id);
                      return time && time.slack > 0;
                    }).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Flexible Projects
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="text-2xl font-bold">
                    {projects.reduce((total, p) => total + p.dependencies.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Dependencies
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}