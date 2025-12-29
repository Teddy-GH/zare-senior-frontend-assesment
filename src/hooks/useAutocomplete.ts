import { useCallback, useEffect, useRef, useState } from "react";
import { AutocompleteService } from "@/lib/dataStructures";

export default function useAutocomplete(items: string[] = [], maxSuggestions: number = 5) {
  const serviceRef = useRef<AutocompleteService | null>(null);
  if (!serviceRef.current) serviceRef.current = new AutocompleteService();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (items && items.length > 0) {
      serviceRef.current!.build(items);
    }
  }, [items]);

  const getSuggestions = useCallback(
    (prefix: string) => {
      if (!prefix || prefix.trim() === "") {
        setSuggestions([]);
        return [];
      }

      const s = serviceRef.current!.getSuggestions(prefix, maxSuggestions);
      setSuggestions(s);
      return s;
    },
    [maxSuggestions]
  );

  const addItem = useCallback((item: string) => serviceRef.current!.addItem(item), []);
  const removeItem = useCallback((item: string) => serviceRef.current!.removeItem(item), []);
  const hasItem = useCallback((item: string) => serviceRef.current!.hasItem(item), []);

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    getSuggestions,
    addItem,
    removeItem,
    hasItem,
  };
}
