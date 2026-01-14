import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

interface SearchResult {
  id: number;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  domain: string;
  status: string;
  eventType: string;
  sentAt: number;
}

interface UseEmailSearchOptions {
  debounceMs?: number;
  minChars?: number;
  limit?: number;
}

/**
 * Hook para busca em tempo real de emails com debounce
 */
export function useEmailSearch(
  projectId: number,
  options: UseEmailSearchOptions = {}
) {
  const { debounceMs = 300, minChars = 2, limit = 20 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation para busca
  const { mutate: searchMutation } = trpc.emailHistory.searchEmails.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsLoading(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  // Função de busca com debounce
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setError(null);

      // Limpar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Se query vazia, limpar resultados
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Se menos de minChars, não buscar
      if (searchQuery.length < minChars) {
        setResults([]);
        return;
      }

      // Configurar novo timer
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        searchMutation({
          projectId,
          query: searchQuery,
          limit,
        });
      }, debounceMs);
    },
    [projectId, debounceMs, minChars, limit, searchMutation]
  );

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    query,
    results,
    isLoading,
    error,
    handleSearch,
    clearSearch,
  };
}

/**
 * Hook para obter sugestões de autocomplete
 */
export function useEmailSearchSuggestions(
  projectId: number,
  type: 'recipient' | 'sender' | 'subject' | 'domain' = 'recipient',
  options: UseEmailSearchOptions = {}
) {
  const { debounceMs = 300, minChars = 1, limit = 10 } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation para sugestões
  const { mutate: suggestionsMutation } = trpc.emailHistory.getEmailSuggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data);
      setIsLoading(false);
    },
  });

  const handleSuggestionSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      if (searchQuery.length < minChars) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        suggestionsMutation({
          projectId,
          query: searchQuery,
          type,
          limit,
        });
      }, debounceMs);
    },
    [projectId, type, debounceMs, minChars, limit, suggestionsMutation]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    suggestions,
    isLoading,
    handleSuggestionSearch,
  };
}

/**
 * Hook para busca avançada com múltiplos filtros
 */
export function useAdvancedEmailSearch(
  projectId: number,
  options: UseEmailSearchOptions = {}
) {
  const { debounceMs = 500, limit = 50 } = options;

  const [filters, setFilters] = useState({
    query: '',
    recipientEmail: '',
    senderEmail: '',
    domain: '',
    status: '',
    eventType: '',
    startDate: '',
    endDate: '',
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation para busca avançada
  const { mutate: advancedSearchMutation } = trpc.emailHistory.advancedSearch.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setIsLoading(false);
    },
  });

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        advancedSearchMutation({
          projectId,
          filters: { ...filters, ...newFilters },
          limit,
        });
      }, debounceMs);
    },
    [projectId, filters, debounceMs, limit, advancedSearchMutation]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      recipientEmail: '',
      senderEmail: '',
      domain: '',
      status: '',
      eventType: '',
      startDate: '',
      endDate: '',
    });
    setResults([]);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    filters,
    results,
    isLoading,
    handleFilterChange,
    resetFilters,
  };
}
