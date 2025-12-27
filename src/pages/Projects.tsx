import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import { projectsApi, type ProjectFilters, type Project } from "@/lib/api";
import { searchProjects, applyFuzzySearchWithFilters } from "@/lib/search";
import DependencyGraph from "@/components/DependencyGraph";
import { AutocompleteService, CachedAPIClient } from "@/lib/dataStructures";
import {
  convertToDependencyFormat,
  getProjectEstimatedDays as getProjectEstimatedDaysHelper,
  getProjectDependencyCount as getProjectDependencyCountHelper,
} from "@/lib/projectsHelpers";

const statusColors = {
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  Planning: "bg-accent/10 text-accent border-accent/20",
  Review: "bg-green-100 text-green-700 border-green-200",
};

const priorityColors = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low: "bg-gray-100 text-gray-700 border-gray-200",
};

// Debounce function for better performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Define the interface for dependency projects
interface DependencyProject {
  id: number;
  name: string;
  dependencies: number[];
  estimatedDays: number;
}


// Custom hook for autocomplete with Trie
function useAutocomplete(items: string[], maxSuggestions: number = 5) {
  const [autocompleteService] = useState(() => new AutocompleteService());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize autocomplete service with items
  useEffect(() => {
    if (items.length > 0) {
      autocompleteService.build(items);
    }
  }, [items, autocompleteService]);

  const getSuggestions = useCallback(
    (prefix: string) => {
      if (prefix.trim() === "") {
        setSuggestions([]);
        return [];
      }

      const suggestions = autocompleteService.getSuggestions(
        prefix,
        maxSuggestions
      );
      setSuggestions(suggestions);
      return suggestions;
    },
    [autocompleteService, maxSuggestions]
  );

  const addItem = useCallback(
    (item: string) => {
      autocompleteService.addItem(item);
    },
    [autocompleteService]
  );

  const removeItem = useCallback(
    (item: string) => {
      autocompleteService.removeItem(item);
    },
    [autocompleteService]
  );

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    getSuggestions,
    addItem,
    removeItem,
    hasItem: autocompleteService.hasItem.bind(autocompleteService),
  };
}

// Custom hook for cached API calls
function useCachedAPI() {
  const [cachedClient] = useState(() => new CachedAPIClient(50)); // 50 items cache capacity

  const fetchWithCache = useCallback(
    async (url: string, options?: RequestInit) => {
      return await cachedClient.fetchWithCache(url, options);
    },
    [cachedClient]
  );

  const getCacheStats = useCallback(() => {
    return cachedClient.getCacheStats();
  }, [cachedClient]);

  const clearCache = useCallback(() => {
    cachedClient.clearCache();
  }, [cachedClient]);

  return {
    fetchWithCache,
    getCacheStats,
    clearCache,
  };
}

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

  const debouncedSearchQuery = useDebounce(searchQuery, 150); // 150ms delay

  // Initialize cached API client
  const { fetchWithCache, getCacheStats, clearCache } = useCachedAPI();

  // Fetch projects with caching
  const {
    data: allProjects,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        // Try the cached API client first
        const data = await fetchWithCache("/api/projects");
        setUsingMockData(false);
        return data;
      } catch (apiError) {
        console.log("API failed, trying direct API call...");

        // Fallback to direct API call
        try {
          const response = await fetch("/api/projects", {
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUsingMockData(false);
            return data;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (fallbackError) {
          console.log("Direct API also failed, using mock data");
          setUsingMockData(true);

          // Return mock data for development/demo
          return [
            {
              id: 1,
              name: "Website Redesign",
              description:
                "Complete overhaul of company website with new design system",
              status: "In Progress",
              priority: "High",
              deadline: "2024-12-15",
              team: "Web Team",
              tasks: {
                total: 15,
                completed: 8,
              },
            },
            {
              id: 2,
              name: "Mobile App Development",
              description:
                "New cross-platform mobile application for iOS and Android",
              status: "Planning",
              priority: "High",
              deadline: "2025-03-20",
              team: "Mobile Team",
              tasks: {
                total: 20,
                completed: 0,
              },
            },
            {
              id: 3,
              name: "Database Migration",
              description:
                "Migrate from legacy database to new cloud-based solution",
              status: "Review",
              priority: "Medium",
              deadline: "2024-11-30",
              team: "DevOps",
              tasks: {
                total: 10,
                completed: 9,
              },
            },
            {
              id: 4,
              name: "User Authentication System",
              description: "Implement OAuth2 and multi-factor authentication",
              status: "In Progress",
              priority: "Medium",
              deadline: "2025-01-15",
              team: "Security Team",
              tasks: {
                total: 12,
                completed: 6,
              },
            },
            {
              id: 5,
              name: "Documentation Update",
              description: "Update all technical and user documentation",
              status: "Planning",
              priority: "Low",
              deadline: "2025-02-28",
              team: "Documentation",
              tasks: {
                total: 8,
                completed: 1,
              },
            },
            {
              id: 6,
              name: "Performance Optimization",
              description:
                "Optimize application performance and reduce loading times",
              status: "In Progress",
              priority: "Medium",
              deadline: "2024-12-10",
              team: "Performance Team",
              tasks: {
                total: 7,
                completed: 4,
              },
            },
          ];
        }
      }
    },
    staleTime: 30000, // 30 seconds
  });

  // Initialize autocomplete service with project and team names
  const autocompleteItems = useMemo(() => {
    if (!allProjects) return [];

    // Extract project names and team names for autocomplete
    const items = new Set<string>();
    allProjects.forEach((project) => {
      items.add(project.name.toLowerCase());
      items.add(project.team.toLowerCase());
      // Also add words from description for better search
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

  // Update dependency projects when allProjects changes
  useEffect(() => {
    if (allProjects) {
      const converted = convertToDependencyFormat(allProjects);
      setDependencyProjects(converted);
    }
  }, [allProjects]);

  // Update autocomplete suggestions when search query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() && isSearchFocused) {
      getAutocompleteSuggestions(debouncedSearchQuery.toLowerCase());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [debouncedSearchQuery, isSearchFocused, getAutocompleteSuggestions]);

  // Apply filters and search on the client side
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];

    // Apply fuzzy search with exact filters
    return applyFuzzySearchWithFilters(
      allProjects,
      debouncedSearchQuery,
      {
        status: filters.status,
        priority: filters.priority,
      },
      ["name", "description", "status", "priority"] // Search fields
    );
  }, [allProjects, debouncedSearchQuery, filters.status, filters.priority]);

  // Sort projects if needed
  const sortedProjects = useMemo(() => {
    if (!filters.sortBy || filters.sortBy === "none") {
      return filteredProjects;
    }

    return [...filteredProjects].sort((a, b) => {
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
  }, [filteredProjects, filters.sortBy, filters.sortOrder]);

  // Handle adding a dependency
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

        // Also update localStorage
        localStorage.setItem(
          `project-deps-${fromId}`,
          JSON.stringify(newProjects[fromProjectIndex].dependencies)
        );
      }

      return newProjects;
    });
  }, []);

  // Handle removing a dependency
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

          // Also update localStorage
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

      // Remove search from filters since we handle it client-side
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
    // Delay hiding suggestions to allow click events on suggestions
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
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v) || searchQuery;

  // Get estimated days for a project (wrapper to use current dependencyProjects state)
  const getProjectEstimatedDays = useCallback(
    (projectId: number) => getProjectEstimatedDaysHelper(dependencyProjects, projectId),
    [dependencyProjects]
  );

  // Get dependency count for a project
  const getProjectDependencyCount = useCallback(
    (projectId: number) => getProjectDependencyCountHelper(dependencyProjects, projectId),
    [dependencyProjects]
  );

  // Update autocomplete when new projects are added
  const handleNewProject = useCallback(
    (projectName: string, teamName: string) => {
      addAutocompleteItem(projectName.toLowerCase());
      addAutocompleteItem(teamName.toLowerCase());
    },
    [addAutocompleteItem]
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your team projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-muted p-1">
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
            className="gap-2"
            onClick={() => {
              // In a real app, this would open a project creation modal
              const newProjectName = `Project ${
                allProjects ? allProjects.length + 1 : 1
              }`;
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

      {/* Development Mode Warning */}
      {usingMockData && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Development Mode:</strong> Using mock data. The API endpoint
            is not available or returned an error.
            <Button
              variant="link"
              className="h-auto p-0 ml-2 text-amber-800"
              onClick={clearCache}
            >
              Clear Cache
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters - Only show in list view */}
      {viewMode === "list" && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <label className="text-sm font-medium mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, teams, or keywords..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  aria-label="Search projects with autocomplete"
                  aria-expanded={showSuggestions}
                  aria-controls="search-suggestions"
                  role="combobox"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  id="search-suggestions"
                  className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                  role="listbox"
                >
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    Suggestions ({suggestions.length})
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between ${
                        index === selectedSuggestionIndex ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                      role="option"
                      aria-selected={index === selectedSuggestionIndex}
                    >
                      <span className="truncate">
                        <Search className="h-3 w-3 inline mr-2 opacity-50" />
                        {suggestion}
                      </span>
                      {index === selectedSuggestionIndex && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      ↑↓
                    </kbd>{" "}
                    to navigate •{" "}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Enter
                    </kbd>{" "}
                    to select •{" "}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Esc
                    </kbd>{" "}
                    to close
                  </div>
                </div>
              )}

              {/* Show "no suggestions" message */}
              {showSuggestions &&
                suggestions.length === 0 &&
                debouncedSearchQuery.trim() && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                    No suggestions found for "{debouncedSearchQuery}"
                  </div>
                )}
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) =>
                  updateFilter("status", v === "all" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-1.5 block">
                Priority
              </label>
              <Select
                value={filters.priority || "all"}
                onValueChange={(v) =>
                  updateFilter("priority", v === "all" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-1.5 block">
                Sort By
              </label>
              <Select
                value={filters.sortBy || "none"}
                onValueChange={(v) =>
                  updateFilter("sortBy", v === "none" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.sortBy && filters.sortBy !== "none" && (
              <div className="w-[140px]">
                <label className="text-sm font-medium mb-1.5 block">
                  Order
                </label>
                <Select
                  value={filters.sortOrder || "asc"}
                  onValueChange={(v) =>
                    updateFilter("sortOrder", v as "asc" | "desc")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Cache Stats Info - Only in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Cache: {getCacheStats().hitRate}
              </Badge>
              <span>
                Hits: {getCacheStats().hits} • Misses: {getCacheStats().misses}
              </span>
              {getCacheStats().errors > 0 && (
                <span className="text-red-600">
                  • Errors: {getCacheStats().errors}
                </span>
              )}
            </div>
          )}

          {/* Projects Count - Only in list view */}
          <div className="text-sm text-muted-foreground">
            Showing {sortedProjects.length} of {allProjects?.length || 0}{" "}
            projects
            {searchQuery && ` matching "${searchQuery}"`}
            {suggestions.length > 0 && isSearchFocused && (
              <span className="ml-2 text-primary">
                • {suggestions.length} suggestion
                {suggestions.length !== 1 ? "s" : ""} available
              </span>
            )}
          </div>
        </>
      )}

      {/* Main Content Area */}
      {viewMode === "list" ? (
        /* Projects Grid View */
        sortedProjects.length === 0 ? (
          <Alert>
            <AlertDescription>
              No projects found.{" "}
              {hasActiveFilters && "Try adjusting your filters."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => {
              const dependencyCount = getProjectDependencyCount(project.id);
              const estimatedDays = getProjectEstimatedDays(project.id);

              return (
                <Card
                  key={project.id}
                  className="shadow-sm hover:shadow-md transition-all group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {dependencyCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            title={`${dependencyCount} dependencies`}
                          >
                            <GitBranch className="h-3 w-3" />
                            {dependencyCount}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={statusColors[project.status]}
                      >
                        {project.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={priorityColors[project.priority]}
                      >
                        {project.priority}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          {project.tasks.completed}/{project.tasks.total} tasks
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (project.tasks.completed / project.tasks.total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{project.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{project.team}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span title="Estimated duration">
                            {estimatedDays}d
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions for dependencies */}
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-2"
                        onClick={() => setViewMode("graph")}
                      >
                        <Network className="h-3 w-3" />
                        View in Dependency Graph
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Dependency Graph View */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-semibold">Dependency Graph View</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize project dependencies and identify critical paths.
                Click "List View" to return to the project list.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {allProjects?.length || 0} projects
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Back to List
              </Button>
            </div>
          </div>

          {dependencyProjects.length > 0 ? (
            <DependencyGraph
              projects={dependencyProjects}
              onDependencyAdd={handleAddDependency}
              onDependencyRemove={handleRemoveDependency}
            />
          ) : (
            <Alert>
              <AlertDescription>
                No projects available for dependency graph.
              </AlertDescription>
            </Alert>
          )}

          {/* Dependency Graph Tips */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              How to Use the Dependency Graph
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Add dependencies:</strong> Select projects from
                dropdowns and click "Add Dependency"
              </li>
              <li>
                • <strong>Critical path:</strong> Highlighted in red - these
                projects cannot be delayed
              </li>
              <li>
                • <strong>Slack time:</strong> Shows how much a project can be
                delayed without affecting deadlines
              </li>
              <li>
                • <strong>Click on projects</strong> to see details and
                dependencies
              </li>
              <li>
                • <strong>Remove dependencies</strong> using the × button next
                to each dependency
              </li>
              <li>
                • <strong>Duration estimates</strong> are calculated based on
                task count and priority
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
