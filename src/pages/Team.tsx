import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  MoreVertical,
  Search,
  X,
  Check,
  AlertCircle,
  Users,
  RefreshCw,
} from "lucide-react";
import { teamApi, type TeamFilters, type TeamMember } from "@/lib/api";
import { AutocompleteService, CachedAPIClient } from "@/lib/dataStructures";

// Mock team data for development
const MOCK_TEAM_DATA: TeamMember[] = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Frontend Developer",
    email: "alex.johnson@example.com",
    projects: 4,
    status: "Active",
    avatar: "bg-blue-500",
    initials: "AJ",
  },
  {
    id: 2,
    name: "Sarah Miller",
    role: "Backend Engineer",
    email: "sarah.miller@example.com",
    projects: 6,
    status: "Active",
    avatar: "bg-purple-500",
    initials: "SM",
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "DevOps Specialist",
    email: "michael.chen@example.com",
    projects: 3,
    status: "Inactive",
    avatar: "bg-green-500",
    initials: "MC",
  },
  {
    id: 4,
    name: "Emma Wilson",
    role: "Product Manager",
    email: "emma.wilson@example.com",
    projects: 5,
    status: "Active",
    avatar: "bg-pink-500",
    initials: "EW",
  },
  {
    id: 5,
    name: "David Brown",
    role: "UI/UX Designer",
    email: "david.brown@example.com",
    projects: 4,
    status: "Active",
    avatar: "bg-yellow-500",
    initials: "DB",
  },
  {
    id: 6,
    name: "Lisa Garcia",
    role: "QA Engineer",
    email: "lisa.garcia@example.com",
    projects: 7,
    status: "Active",
    avatar: "bg-red-500",
    initials: "LG",
  },
  {
    id: 7,
    name: "Robert Lee",
    role: "Full Stack Developer",
    email: "robert.lee@example.com",
    projects: 5,
    status: "Inactive",
    avatar: "bg-indigo-500",
    initials: "RL",
  },
  {
    id: 8,
    name: "Jennifer Taylor",
    role: "Data Analyst",
    email: "jennifer.taylor@example.com",
    projects: 3,
    status: "Active",
    avatar: "bg-teal-500",
    initials: "JT",
  },
];

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for autocomplete to prevent Trie rebuilds
function useTeamAutocomplete(teamMembers?: TeamMember[]) {
  const autocompleteServiceRef = useRef<AutocompleteService | null>(null);
  const lastTeamMembersRef = useRef<TeamMember[]>([]);

  // Get or create autocomplete service
  const getService = useCallback(() => {
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new AutocompleteService();
    }
    return autocompleteServiceRef.current;
  }, []);

  // Build autocomplete data only when team members change
  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      // Only rebuild if team members actually changed
      const currentTeamIds = teamMembers.map((m) => m.id).join(",");
      const lastTeamIds = lastTeamMembersRef.current.map((m) => m.id).join(",");

      if (currentTeamIds !== lastTeamIds) {
        lastTeamMembersRef.current = teamMembers;

        const items = new Set<string>();
        teamMembers.forEach((member) => {
          items.add(member.name.toLowerCase());
          items.add(member.role.toLowerCase());
          const emailUser = member.email.split("@")[0];
          items.add(emailUser.toLowerCase());

          // Add name parts
          const nameParts = member.name.toLowerCase().split(" ");
          nameParts.forEach((part) => {
            if (part.length > 1) items.add(part);
          });
        });

        const service = getService();
        service.build(Array.from(items));
      }
    }
  }, [teamMembers, getService]);

  const getSuggestions = useCallback(
    (prefix: string, limit: number = 5) => {
      const service = getService();
      return service.getSuggestions(prefix, limit);
    },
    [getService]
  );

  const addItem = useCallback(
    (item: string) => {
      const service = getService();
      service.addItem(item);
    },
    [getService]
  );

  return {
    getSuggestions,
    addItem,
    hasItem: (item: string) => {
      const service = getService();
      return service.hasItem(item);
    },
  };
}

export default function Team() {
  const [filters, setFilters] = useState<TeamFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize cached API client
  const cachedClientRef = useRef<CachedAPIClient>(new CachedAPIClient(50));
  const cache = cachedClientRef.current.getCache();

  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Increased for better performance

  // Fetch team members - simplified query
  const {
    data: teamMembers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["team", filters],
    queryFn: async () => {
      try {
        // Try to fetch from API with cache
        const cacheKey = `team::${JSON.stringify(filters)}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          return cached;
        }

        const data = await teamApi.getAll(filters);
        cache.put(cacheKey, data);
        return data;
      } catch (error) {
        // Use mock data and apply filters
        let filteredData = [...MOCK_TEAM_DATA];

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = filteredData.filter(
            (member) =>
              member.name.toLowerCase().includes(searchLower) ||
              member.role.toLowerCase().includes(searchLower) ||
              member.email.toLowerCase().includes(searchLower)
          );
        }

        if (filters.status === "Active") {
          filteredData = filteredData.filter(
            (member) => member.status === "Active"
          );
        } else if (filters.status === "Inactive") {
          filteredData = filteredData.filter(
            (member) => member.status === "Inactive"
          );
        }

        return filteredData;
      }
    },
  });

  // Initialize autocomplete - use ref to prevent recreation
  const autocomplete = useTeamAutocomplete(teamMembers);

  // Update suggestions when search query changes - optimized
  useEffect(() => {
    if (debouncedSearchQuery.trim() && isSearchFocused) {
      const newSuggestions = autocomplete.getSuggestions(
        debouncedSearchQuery.toLowerCase(),
        4
      ); // Reduced to 4
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearchQuery, isSearchFocused, autocomplete]);

  // Update filter when search changes - with debounce
  useEffect(() => {
    if (debouncedSearchQuery !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        search: debouncedSearchQuery || undefined,
      }));
    }
  }, [debouncedSearchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
      setShowSuggestions(false);
    }, 150);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(false);
  };

  const clearCache = () => {
    cachedClientRef.current.clearCache();
  };

  const handleAddTeamMember = () => {
    const newMemberName = `New Member ${
      teamMembers ? teamMembers.length + 1 : 1
    }`;
    const newRole = "Team Member";

    autocomplete.addItem(newMemberName.toLowerCase());
    autocomplete.addItem(newRole.toLowerCase());

    alert(`New team member "${newMemberName}" would be created`);
  };

  const updateStatusFilter = (status: "Active" | "Inactive" | undefined) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  // Calculate statistics - memoized
  const teamStats = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) {
      return {
        active: 0,
        inactive: 0,
        totalProjects: 0,
        uniqueRoles: 0,
        avgProjects: 0,
      };
    }

    const active = teamMembers.filter((m) => m.status === "Active").length;
    const inactive = teamMembers.filter((m) => m.status === "Inactive").length;
    const totalProjects = teamMembers.reduce((sum, m) => sum + m.projects, 0);
    const uniqueRoles = new Set(teamMembers.map((m) => m.role)).size;
    const avgProjects = totalProjects / teamMembers.length;

    return { active, inactive, totalProjects, uniqueRoles, avgProjects };
  }, [teamMembers]);

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

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Team</h1>
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load team members"}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const cacheStats = cachedClientRef.current.getCacheStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-2">
            {teamMembers?.length || 0} members in your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCacheStats(!showCacheStats)}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Cache Stats
          </Button>
          <Button className="gap-2" onClick={handleAddTeamMember}>
            <Users className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Cache Statistics Panel */}
      {showCacheStats && (
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Cache Performance</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCache}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Clear Cache
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCacheStats(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Cache Hit Rate
                </div>
                <div className="text-2xl font-bold">{cacheStats.hitRate}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Hits</div>
                <div className="text-2xl font-bold text-green-600">
                  {cacheStats.hits}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Misses</div>
                <div className="text-2xl font-bold text-amber-600">
                  {cacheStats.misses}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Cache Size</div>
                <div className="text-2xl font-bold">
                  {cacheStats.cacheStats.size}/{cacheStats.cacheStats.capacity}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search with Autocomplete */}
      <div className="max-w-md relative">
        <label className="text-sm font-medium mb-1.5 block">
          Search Team Members
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown - Only show if there are suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={`w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between ${
                  index === selectedSuggestionIndex ? "bg-muted" : ""
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()}
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
          </div>
        )}
      </div>

      {/* Status Filter - Only Active/Inactive */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Filter by status:</span>
        <div className="flex gap-2">
          <Button
            variant={!filters.status ? "default" : "outline"}
            size="sm"
            onClick={() => updateStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={filters.status === "Active" ? "default" : "outline"}
            size="sm"
            onClick={() => updateStatusFilter("Active")}
          >
            Active
          </Button>
          <Button
            variant={filters.status === "Inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => updateStatusFilter("Inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Team Grid */}
      {teamMembers && teamMembers.length === 0 ? (
        <Alert>
          <AlertDescription>
            No team members found.{" "}
            {filters.search && "Try adjusting your search."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teamMembers?.map((member) => (
            <Card
              key={member.id}
              className="shadow-sm hover:shadow transition-all"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <Avatar className={`h-12 w-12 ${member.avatar}`}>
                    <AvatarFallback className="text-white font-semibold">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        member.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {member.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Projects: </span>
                      <span className="font-semibold text-foreground">
                        {member.projects}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Statistics - Simplified */}
      {teamMembers && teamMembers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          <Card className="border">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-xl font-bold">{teamStats.active}</div>
                <div className="text-sm text-muted-foreground mt-1">Active</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-xl font-bold">{teamStats.inactive}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Inactive
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-xl font-bold">
                  {teamStats.totalProjects}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Projects
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-xl font-bold">
                  {teamStats.avgProjects.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Avg/Member
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
