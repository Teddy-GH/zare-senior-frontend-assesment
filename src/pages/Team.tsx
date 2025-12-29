import { useState, useMemo, useEffect } from "react";
import useTeam from "@/hooks/useTeam";
import useCachedAPI from "@/hooks/useCachedAPI";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  X,
  Check,
  Users,
  RefreshCw,
} from "lucide-react";
import type { TeamFilters } from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import useAutocomplete from "@/hooks/useAutocomplete";
import { calculateTeamStats, generateTeamAutocompleteItems } from "@/lib/teamHelpers";

export default function Team() {
  const [filters, setFilters] = useState<TeamFilters>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Increased for better performance

  // Fetch team members using shared api hooks
  const {
    data: teamMembers,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTeam(filters);

  // Cache helpers (optional)
  const { getCacheStats, clearCache } = useCachedAPI();

  // Initialize autocomplete items and hook
  const autocompleteItems = useMemo(() => generateTeamAutocompleteItems(teamMembers), [teamMembers]);
  const autocomplete = useAutocomplete(autocompleteItems, 4);

  // Update suggestions when search query changes - optimized
  useEffect(() => {
    if (debouncedSearchQuery.trim() && isSearchFocused) {
      const newSuggestions = autocomplete.getSuggestions(
        debouncedSearchQuery.toLowerCase()
      ); 
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

  // clearCache provided by useCachedAPI above

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
  const teamStats = useMemo(() => calculateTeamStats(teamMembers), [teamMembers]);

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

  const cacheStats = getCacheStats();

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
          {isFetching && (
            <RefreshCw className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
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
