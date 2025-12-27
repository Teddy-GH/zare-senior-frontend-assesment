import { CachedAPIClient } from "@/lib/dataStructures";
import { useCallback, useState } from "react";

// Custom hook for cached API calls
export default function useCachedAPI() {
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