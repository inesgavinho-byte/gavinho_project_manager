import React, { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Loader2, AlertCircle } from 'lucide-react';

// Brand colors GAVINHO
const BRAND_COLORS = {
  dark: '#7a7667',
  medium: '#8b8670',
  light: '#adaa96',
  cream: '#f2f0e7',
};

interface ProjectSearchAutocompleteProps {
  onProjectSelect?: (projectId: string, projectName: string) => void;
  placeholder?: string;
  minChars?: number;
}

interface SearchResult {
  id: string;
  name: string;
  status: string;
  priority: string;
  progress: number;
}

export function ProjectSearchAutocomplete({
  onProjectSelect,
  placeholder = 'Buscar projetos...',
  minChars = 2,
}: ProjectSearchAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: quickSearchResults, isLoading } = trpc.executiveDashboard.quickSearch.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= minChars }
  );

  const { data: suggestions } = trpc.executiveDashboard.getSearchSuggestions.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= minChars }
  );

  // Combinar resultados de projetos e sugestões
  const projects = quickSearchResults?.projects || [];
  const allSuggestions = suggestions || [];

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lidar com navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' && searchQuery.length >= minChars) {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = projects.length + allSuggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < projects.length) {
          const project = projects[selectedIndex];
          handleSelectProject(project);
        } else if (selectedIndex >= projects.length) {
          const suggestion = allSuggestions[selectedIndex - projects.length];
          setSearchQuery(suggestion);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectProject = (project: SearchResult) => {
    onProjectSelect?.(project.id, project.name);
    setSearchQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSelectedIndex(-1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          style={{ color: BRAND_COLORS.medium }}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length >= minChars) {
              setIsOpen(true);
              setSelectedIndex(-1);
            } else {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (searchQuery.length >= minChars) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2"
          style={{
            borderColor: BRAND_COLORS.light,
          }}
        />
        {isLoading && (
          <Loader2
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin"
            style={{ color: BRAND_COLORS.medium }}
          />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && searchQuery.length >= minChars && (
        <Card
          className="absolute top-full left-0 right-0 mt-2 shadow-lg border-0 z-50"
          style={{ backgroundColor: BRAND_COLORS.cream }}
        >
          <div className="max-h-96 overflow-y-auto">
            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <div
                  className="px-4 py-2 text-xs font-semibold"
                  style={{ color: BRAND_COLORS.dark, backgroundColor: '#f5f5f5' }}
                >
                  Projetos ({projects.length})
                </div>
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                      selectedIndex === index
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectProject(project)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm" style={{ color: BRAND_COLORS.dark }}>
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-xs font-semibold" style={{ color: BRAND_COLORS.medium }}>
                          {project.progress}%
                        </div>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: BRAND_COLORS.medium,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {allSuggestions.length > 0 && (
              <div>
                <div
                  className="px-4 py-2 text-xs font-semibold"
                  style={{ color: BRAND_COLORS.dark, backgroundColor: '#f5f5f5' }}
                >
                  Sugestões
                </div>
                {allSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`px-4 py-2 cursor-pointer transition-colors border-b last:border-b-0 ${
                      selectedIndex === projects.length + index
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(projects.length + index)}
                  >
                    <p className="text-sm" style={{ color: BRAND_COLORS.dark }}>
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {projects.length === 0 && allSuggestions.length === 0 && !isLoading && (
              <div className="px-4 py-6 text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Nenhum projeto encontrado para "{searchQuery}"
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="px-4 py-6 text-center">
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" />
                <p className="text-sm text-gray-600 mt-2">Carregando resultados...</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Hint Text */}
      {searchQuery.length > 0 && searchQuery.length < minChars && (
        <p className="text-xs text-gray-500 mt-1">
          Digite pelo menos {minChars} caracteres para buscar
        </p>
      )}
    </div>
  );
}
