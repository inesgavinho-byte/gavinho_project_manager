import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useEmailSearch, useEmailSearchSuggestions } from '@/hooks/useEmailSearch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmailSearchBarProps {
  projectId: number;
  onResultsChange?: (results: any[]) => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function EmailSearchBar({
  projectId,
  onResultsChange,
  onSearchChange,
  placeholder = 'Buscar emails por destinatário, assunto, remetente...',
  className = '',
}: EmailSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipient' | 'sender' | 'subject' | 'domain'>('recipient');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Hooks de busca
  const {
    query,
    results,
    isLoading,
    handleSearch,
    clearSearch,
  } = useEmailSearch(projectId, {
    debounceMs: 300,
    minChars: 2,
    limit: 20,
  });

  // Hook de sugestões
  const {
    suggestions,
    isLoading: suggestionsLoading,
    handleSuggestionSearch,
  } = useEmailSearchSuggestions(projectId, activeTab, {
    debounceMs: 200,
    minChars: 1,
    limit: 10,
  });

  // Atualizar callback quando resultados mudam
  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  // Atualizar callback quando query muda
  useEffect(() => {
    onSearchChange?.(query);
  }, [query, onSearchChange]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
    handleSuggestionSearch(value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
    setIsOpen(false);
  };

  const handleClear = () => {
    clearSearch();
    setIsOpen(false);
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Input de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && (query || suggestions.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border border-gray-200">
          {/* Tabs de Sugestões */}
          {!query && (
            <div className="border-b border-gray-200 flex gap-0">
              {(['recipient', 'sender', 'subject', 'domain'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    handleSuggestionSearch(query);
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'recipient' && 'Destinatários'}
                  {tab === 'sender' && 'Remetentes'}
                  {tab === 'subject' && 'Assuntos'}
                  {tab === 'domain' && 'Domínios'}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {/* Resultados de Busca */}
            {query && results.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-600 px-2 py-1">Emails encontrados ({results.length})</p>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      handleSuggestionClick(result.recipientEmail);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm truncate">{result.recipientEmail}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {result.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{result.subject}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.sentAt).toLocaleDateString('pt-PT')} • {result.eventType}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sugestões */}
            {!query && suggestions.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-600 px-2 py-1">Sugestões</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <p className="text-sm text-gray-900">{suggestion}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {(isLoading || suggestionsLoading) && !results.length && !suggestions.length && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-600 mt-2">Carregando...</p>
              </div>
            )}

            {/* Sem Resultados */}
            {query && !isLoading && results.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600">Nenhum email encontrado para "{query}"</p>
              </div>
            )}

            {!query && !suggestionsLoading && suggestions.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600">Digite para ver sugestões</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Componente simplificado de SearchBar apenas com input
 */
export function SimpleEmailSearchBar({
  projectId,
  onSearch,
  placeholder = 'Buscar emails...',
  className = '',
}: {
  projectId: number;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { query, handleSearch, clearSearch } = useEmailSearch(projectId, {
    debounceMs: 300,
    minChars: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearch(value);
    onSearch?.(value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
