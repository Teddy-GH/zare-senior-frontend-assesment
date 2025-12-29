import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeString } from "@/lib/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  MoreVertical,
  Calendar,
  Users,
  Search,
  X,
  GitBranch,
  List,
  Network,
  Clock,
  Check,
  AlertCircle,
  SortAsc,
  SortDesc,
  BarChart3,
  Eye,
  Shield,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { type ProjectFilters, type Project } from "@/lib/api";
import useProjects from "@/hooks/useProjects";
import { fuzzySearch } from "@/lib/search";
import { Switch } from "@/components/ui/switch";
import DependencyGraph from "@/components/DependencyGraph";
import useDebounce from "@/hooks/useDebounce";
import useAutocomplete from "@/hooks/useAutocomplete";
import {
  convertToDependencyFormat,
  getProjectEstimatedDays as getProjectEstimatedDaysHelper,
  getProjectDependencyCount as getProjectDependencyCountHelper,
} from "@/lib/projectsHelpers";
import useCachedAPI from "@/hooks/useCachedAPI";
import { Progress } from "@radix-ui/react-progress";

// Enhanced color schemes with gradients and better contrast
const statusColors = {
  "In Progress": "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 border-blue-300/50",
  Planning: "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-700 border-purple-300/50",
  Review: "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700 border-green-300/50",
};

const priorityColors = {
  High: "bg-gradient-to-r from-rose-500/20 to-rose-600/20 text-rose-700 border-rose-300/50",
  Medium: "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-700 border-amber-300/50",
  Low: "bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-700 border-slate-300/50",
};

// Progress bar colors based on completion percentage
const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return "bg-gradient-to-r from-green-500 to-emerald-600";
  if (percentage >= 50) return "bg-gradient-to-r from-blue-500 to-cyan-600";
  if (percentage >= 30) return "bg-gradient-to-r from-amber-500 to-orange-600";
  return "bg-gradient-to-r from-rose-500 to-pink-600";
};

// useDebounce provided by src/hooks/useDebounce

// Define the interface for dependency projects
interface DependencyProject {
  id: number;
  name: string;
  dependencies: number[];
  estimatedDays: number;
}

// useAutocomplete provided by src/hooks/useAutocomplete

export default function Projects() {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [dependencyProjects, setDependencyProjects] = useState<
    DependencyProject[]
  >([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [usingMockData, setUsingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  const [smartSearchEnabled, setSmartSearchEnabled] = useState<boolean>(false);

  // Fetch projects via shared hook
  const {
    data: allProjects,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjects(filters);
  ;

  // Cache helpers
  const { getCacheStats, clearCache } = useCachedAPI();
  const cacheStats = getCacheStats();

  // Initialize autocomplete service
  const autocompleteItems = useMemo(() => {
    if (!allProjects) return [];

    const items = new Set<string>();
    allProjects.forEach((project) => {
      items.add(project.name.toLowerCase());
      items.add(project.team.toString().toLowerCase());
      project.description
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 2 && !items.has(word)) items.add(word);
        });
    });

    return Array.from(items);
  }, [allProjects]);

  const {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    getSuggestions: getAutocompleteSuggestions,
    addItem: addAutocompleteItem,
  } = useAutocomplete(autocompleteItems, 8);

  // Update dependency projects
  useEffect(() => {
    if (allProjects) {
      const converted = convertToDependencyFormat(allProjects);
      setDependencyProjects(converted);
    }
  }, [allProjects]);

  // Update autocomplete suggestions
  useEffect(() => {
    if (debouncedSearchQuery.trim() && isSearchFocused) {
      getAutocompleteSuggestions(debouncedSearchQuery.toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [debouncedSearchQuery, isSearchFocused, getAutocompleteSuggestions]);

  // Apply filters and search (supports both basic and smart fuzzy search)
  const { projects: filteredProjects, scoreMap } = useMemo(() => {
    type ScoreInfo = { score: number; matchedField?: string; matchedValue?: string };
    if (!allProjects) return { projects: [], scoreMap: new Map<number, ScoreInfo>() };

    // First apply exact filters (status, priority)
    const normalizedStatus = filters.status ? filters.status : undefined;
    const normalizedPriority = filters.priority ? filters.priority : undefined;

    let filtered = allProjects.filter((p) => {
      if (normalizedStatus && normalizeString(p.status) !== normalizeString(normalizedStatus)) return false;
      if (normalizedPriority && normalizeString(p.priority) !== normalizeString(normalizedPriority)) return false;
      return true;
    });

    const fields = ["name", "description", "status", "priority"];
    const scoreMap = new Map<number, ScoreInfo>();

    const q = debouncedSearchQuery.trim();
    if (!q) {
      return { projects: filtered, scoreMap };
    }

    // Smart fuzzy search path
    if (smartSearchEnabled) {
      const results = fuzzySearch(filtered, q, fields);
      results.forEach((r) =>
        scoreMap.set((r.item as Project).id, {
          score: r.score,
          matchedField: r.matchedField,
          matchedValue: r.matchedValue,
        })
      );
      return { projects: results.map((r) => r.item as Project), scoreMap };
    }

    // Basic string matching path (case-insensitive contains)
    const nq = q.toLowerCase();
    const basic = filtered.filter((p) => {
      return fields.some((f) => String(p[f] ?? "").toLowerCase().includes(nq));
    });

    return { projects: basic, scoreMap };
  }, [allProjects, debouncedSearchQuery, filters.status, filters.priority, smartSearchEnabled]);

  // Apply tab filtering
  const tabFilteredProjects = useMemo(() => {
    if (activeTab === "all") return filteredProjects;
    return filteredProjects.filter(project => project.status === activeTab);
  }, [filteredProjects, activeTab]);

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!filters.sortBy || filters.sortBy === "none") {
      return tabFilteredProjects;
    }

    return [...tabFilteredProjects].sort((a, b) => {
      const order = filters.sortOrder === "desc" ? -1 : 1;

      switch (filters.sortBy) {
        case "name":
          return order * a.name.localeCompare(b.name);
        case "deadline":
          return (
            order * new Date(a.deadline).getTime() -
            new Date(b.deadline).getTime()
          );
        case "priority":
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          return (
            order * (priorityOrder[a.priority] - priorityOrder[b.priority])
          );
        default:
          return 0;
      }
    });
  }, [tabFilteredProjects, filters.sortBy, filters.sortOrder]);

  // Dependency handlers
  const handleAddDependency = useCallback((fromId: number, toId: number) => {
    setDependencyProjects((prev) => {
      const newProjects = [...prev];
      const fromProjectIndex = newProjects.findIndex((p) => p.id === fromId);

      if (
        fromProjectIndex !== -1 &&
        !newProjects[fromProjectIndex].dependencies.includes(toId)
      ) {
        newProjects[fromProjectIndex] = {
          ...newProjects[fromProjectIndex],
          dependencies: [...newProjects[fromProjectIndex].dependencies, toId],
        };

        localStorage.setItem(
          `project-deps-${fromId}`,
          JSON.stringify(newProjects[fromProjectIndex].dependencies)
        );
      }

      return newProjects;
    });
  }, []);

  const handleRemoveDependency = useCallback(
    (projectId: number, dependencyId: number) => {
      setDependencyProjects((prev) => {
        const newProjects = [...prev];
        const projectIndex = newProjects.findIndex((p) => p.id === projectId);

        if (projectIndex !== -1) {
          newProjects[projectIndex] = {
            ...newProjects[projectIndex],
            dependencies: newProjects[projectIndex].dependencies.filter(
              (id) => id !== dependencyId
            ),
          };

          localStorage.setItem(
            `project-deps-${projectId}`,
            JSON.stringify(newProjects[projectIndex].dependencies)
          );
        }

        return newProjects;
      });
    },
    []
  );

  // Filter and search handlers
  const updateFilter = useCallback(
    (key: keyof ProjectFilters, value: string | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value || undefined,
      }));
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setSelectedSuggestionIndex(-1);
      const { search, ...rest } = filters;
      setFilters(rest);
    },
    [filters]
  );

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    if (searchQuery.trim()) {
      setShowSuggestions(true);
    }
  }, [searchQuery]);

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => {
      setIsSearchFocused(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedSuggestionIndex,
      handleSuggestionClick,
    ]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(false);
    setActiveTab("all");
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v) || searchQuery || activeTab !== "all";

  // Helper functions
  const getProjectEstimatedDays = useCallback(
    (projectId: number) => getProjectEstimatedDaysHelper(dependencyProjects, projectId),
    [dependencyProjects]
  );

  const getProjectDependencyCount = useCallback(
    (projectId: number) => getProjectDependencyCountHelper(dependencyProjects, projectId),
    [dependencyProjects]
  );

  const handleNewProject = useCallback(
    (projectName: string, teamName: string) => {
      addAutocompleteItem(projectName.toLowerCase());
      addAutocompleteItem(teamName.toLowerCase());
    },
    [addAutocompleteItem]
  );

  // Calculate stats for header
  const projectStats = useMemo(() => {
    if (!allProjects) return null;
    
    const total = allProjects.length;
    const completed = allProjects.filter(p => p.tasks.completed === p.tasks.total).length;
    const inProgress = allProjects.filter(p => p.status === "In Progress").length;
    const highPriority = allProjects.filter(p => p.priority === "High").length;
    
    return { total, completed, inProgress, highPriority };
  }, [allProjects]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your team projects with advanced analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                List View
              </Button>
              <Button
                variant={viewMode === "graph" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode("graph")}
              >
                <Network className="h-4 w-4" />
                Graph View
              </Button>
            </div>
            <Button
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                const newProjectName = `Project ${allProjects ? allProjects.length + 1 : 1}`;
                const newTeamName = "New Team";
                handleNewProject(newProjectName, newTeamName);
                alert(`New project "${newProjectName}" would be created`);
              }}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {projectStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Projects</p>
                    <h3 className="text-2xl font-bold text-blue-900">{projectStats.total}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">In Progress</p>
                    <h3 className="text-2xl font-bold text-green-900">{projectStats.inProgress}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">High Priority</p>
                    <h3 className="text-2xl font-bold text-amber-900">{projectStats.highPriority}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Completed</p>
                    <h3 className="text-2xl font-bold text-emerald-900">{projectStats.completed}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-500/20">
                    <Check className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Development Mode Warning */}
      {usingMockData && (
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Development Mode:</strong> Using mock data. The API endpoint
            is not available or returned an error.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <>
          {/* Enhanced Filters Section */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Status Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-5 w-full max-w-md">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="In Progress" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500">
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger value="Planning" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                      Planning
                    </TabsTrigger>
                    <TabsTrigger value="Review" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500">
                      Review
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-wrap gap-4 items-end">
                  {/* Enhanced Search */}
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects, teams, or keywords..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        onKeyDown={handleKeyDown}
                        className="pl-9 bg-white border-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                      {isFetching && (
                        <RefreshCw className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                      )}
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 hover:bg-transparent"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Enhanced Autocomplete Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-border">
                          <div className="text-sm font-semibold text-blue-700">
                            Suggestions ({suggestions.length})
                          </div>
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion}-${index}`}
                            className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all flex items-center justify-between ${
                              index === selectedSuggestionIndex ? "bg-gradient-to-r from-blue-50 to-purple-50" : ""
                            }`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                                <Search className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-medium">{suggestion}</span>
                            </div>
                            {index === selectedSuggestionIndex && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                        <div className="px-4 py-3 bg-slate-50 border-t border-border">
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white border rounded text-xs font-semibold">↑↓</kbd>
                            <span>Navigate</span>
                            <kbd className="px-2 py-1 bg-white border rounded text-xs font-semibold">Enter</kbd>
                            <span>Select</span>
                            <kbd className="px-2 py-1 bg-white border rounded text-xs font-semibold">Esc</kbd>
                            <span>Close</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Filter Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="text-sm font-medium text-muted-foreground">Smart Search</div>
                      <Switch
                        checked={smartSearchEnabled}
                        onCheckedChange={(v) => setSmartSearchEnabled(Boolean(v))}
                        aria-label="Toggle Smart Search"
                      />
                    </div>
                    <div className="w-[160px]">
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(v) =>
                          updateFilter("status", v === "all" ? undefined : v)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[160px]">
                      <Select
                        value={filters.priority || "all"}
                        onValueChange={(v) =>
                          updateFilter("priority", v === "all" ? undefined : v)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[160px]">
                      <Select
                        value={filters.sortBy || "deadline"}
                        onValueChange={(v) =>
                          updateFilter("sortBy", v === "deadline" ? undefined : v)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filters.sortBy && filters.sortBy !== "none" && (
                      <div className="w-[140px]">
                        <Select
                          value={filters.sortOrder || "asc"}
                          onValueChange={(v) =>
                            updateFilter("sortOrder", v as "asc" | "desc")
                          }
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Order" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">
                              <div className="flex items-center gap-2">
                                <SortAsc className="h-3 w-3" />
                                Ascending
                              </div>
                            </SelectItem>
                            <SelectItem value="desc">
                              <div className="flex items-center gap-2">
                                <SortDesc className="h-3 w-3" />
                                Descending
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="gap-2 border-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Results Count & Cache Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-sm font-medium">
                    <span className="text-muted-foreground">Showing</span>
                    <span className="mx-2 font-bold text-blue-600">{sortedProjects.length}</span>
                    <span className="text-muted-foreground">of</span>
                    <span className="mx-2 font-bold">{allProjects?.length || 0}</span>
                    <span className="text-muted-foreground">projects</span>
                    {searchQuery && (
                      <span className="ml-4 text-blue-600 font-medium">
                        for "{searchQuery}"
                      </span>
                    )}
                  </div>

                  {process.env.NODE_ENV === "development" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="bg-white/50 text-xs">
                            🚀 Cache: {cacheStats.hitRate}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Hits: {cacheStats.hits}</p>
                          <p>Misses: {cacheStats.misses}</p>
                          {cacheStats.errors > 0 && (
                            <p className="text-red-600">Errors: {cacheStats.errors}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Projects Grid */}
          {sortedProjects.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 w-fit mx-auto">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">No projects found</h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters 
                      ? "Try adjusting your filters or search query"
                      : "No projects available. Create your first project to get started."}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => {
                const dependencyCount = getProjectDependencyCount(project.id);
                const estimatedDays = getProjectEstimatedDays(project.id);
                const progressPercentage = (project.tasks.completed / project.tasks.total) * 100;

                return (
                  <Card
                    key={project.id}
                    className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 overflow-hidden"
                  >
                    {/* Card Header with Gradient */}
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-foreground truncate">
                            {project.name}
                          </CardTitle>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 cursor-help">
                                  {project.description}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{project.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {dependencyCount > 0 && (
                            <Badge
                              variant="outline"
                              className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 font-medium"
                            >
                              <GitBranch className="h-3 w-3 mr-1" />
                              {dependencyCount}
                            </Badge>
                          )}
                          {scoreMap && scoreMap.get && scoreMap.get(project.id) != null && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="bg-white/60 text-xs font-semibold">
                                    {scoreMap.get(project.id)?.score}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <div className="font-semibold">Score: {scoreMap.get(project.id)?.score}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {(() => {
                                        const info = scoreMap.get(project.id);
                                        if (!info) return null;
                                        const s = info.score;
                                        if (s === 100) return "Exact match";
                                        if (s === 75) return `Starts with in ${info.matchedField || "field"}`;
                                        if (s === 50) return `Contains in ${info.matchedField || "field"}`;
                                        if (s === 25) return `Fuzzy match (typo) in ${info.matchedField || "field"}`;
                                        return "Match";
                                      })()}
                                    </div>
                                    {scoreMap.get(project.id)?.matchedValue && (
                                      <div className="mt-1 text-xs text-muted-foreground">Matched: {scoreMap.get(project.id)?.matchedValue}</div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Status & Priority Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={`${statusColors[project.status]} font-semibold`}
                        >
                          {project.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${priorityColors[project.priority]} font-semibold`}
                        >
                          {project.priority}
                        </Badge>
                      </div>

                      {/* Enhanced Progress Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-blue-100">
                              <BarChart3 className="h-3 w-3 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">Progress</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            {project.tasks.completed}/{project.tasks.total} tasks
                            <span className="ml-2 text-blue-600">
                              ({Math.round(progressPercentage)}%)
                            </span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <Progress 
                            value={progressPercentage} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Project Metadata */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Deadline</span>
                          </div>
                          <div className="font-semibold text-foreground">{project.deadline}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Duration</span>
                          </div>
                          <div className="font-semibold text-foreground">{estimatedDays}d</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Team</span>
                          </div>
                          <div className="font-semibold text-foreground">{project.team}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                          onClick={() => setViewMode("graph")}
                        >
                          <Network className="h-3 w-3" />
                          View Graph
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                        >
                          <Eye className="h-3 w-3" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Enhanced Dependency Graph View */
        <div className="space-y-6">
          {/* Graph Header */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dependency Graph
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Visualize project dependencies and identify critical paths
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white font-medium">
                    <GitBranch className="h-3 w-3 mr-1" />
                    {allProjects?.length || 0} projects
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("list")}
                    className="gap-2 border-2"
                  >
                    <List className="h-4 w-4" />
                    Back to List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Graph Container */}
          <Card className="border-0 shadow-sm min-h-[600px]">
            <CardContent className="p-0 h-full">
              {dependencyProjects.length > 0 ? (
                <DependencyGraph
                  projects={dependencyProjects}
                  onDependencyAdd={handleAddDependency}
                  onDependencyRemove={handleRemoveDependency}
                />
              ) : (
                <div className="flex items-center justify-center h-[600px]">
                  <Alert>
                    <AlertDescription>
                      No projects available for dependency graph.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Tips Panel */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-blue-800 mb-3">
                    How to Use the Dependency Graph
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-blue-100">
                          <Target className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="font-semibold text-blue-700">Add Dependencies</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Select projects from dropdowns and click "Add Dependency"
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-rose-100">
                          <AlertCircle className="h-3 w-3 text-rose-600" />
                        </div>
                        <span className="font-semibold text-rose-700">Critical Path</span>
                      </div>
                      <p className="text-sm text-rose-600">
                        Highlighted in red - these projects cannot be delayed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-green-100">
                          <Clock className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="font-semibold text-green-700">Slack Time</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Shows how much a project can be delayed without affecting deadlines
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}