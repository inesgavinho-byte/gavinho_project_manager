import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

export interface DashboardFilters {
  status?: string;
  period?: "7d" | "30d" | "90d" | "all";
  responsible?: string;
  searchQuery?: string;
}

interface DashboardFilterBarProps {
  onFiltersChange: (filters: DashboardFilters) => void;
  statusOptions?: Array<{ value: string; label: string }>;
  responsibleOptions?: Array<{ value: string; label: string }>;
  showSearch?: boolean;
  showStatus?: boolean;
  showPeriod?: boolean;
  showResponsible?: boolean;
}

export function DashboardFilterBar({
  onFiltersChange,
  statusOptions = [
    { value: "planning", label: "Planeamento" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluído" },
    { value: "on_hold", label: "Suspenso" },
  ],
  responsibleOptions = [],
  showSearch = true,
  showStatus = true,
  showPeriod = true,
  showResponsible = true,
}: DashboardFilterBarProps) {
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const saved = localStorage.getItem("dashboardFilters");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("dashboardFilters", JSON.stringify(filters));
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
    }));
  };

  const handlePeriodChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      period: (value === "all" ? undefined : value) as any,
    }));
  };

  const handleResponsibleChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      responsible: value === "all" ? undefined : value,
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-700">Filtros</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} ativo{activeFilterCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {showSearch && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Buscar
            </label>
            <Input
              placeholder="Digite para buscar..."
              value={filters.searchQuery || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {showStatus && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Status
            </label>
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showPeriod && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Período
            </label>
            <Select
              value={filters.period || "all"}
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showResponsible && responsibleOptions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Responsável
            </label>
            <Select
              value={filters.responsible || "all"}
              onValueChange={handleResponsibleChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Responsáveis</SelectItem>
                {responsibleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1">
              Busca: {filters.searchQuery}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleSearchChange("")}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {statusOptions.find((o) => o.value === filters.status)?.label}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleStatusChange("all")}
              />
            </Badge>
          )}
          {filters.period && (
            <Badge variant="outline" className="flex items-center gap-1">
              Período: {filters.period}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handlePeriodChange("all")}
              />
            </Badge>
          )}
          {filters.responsible && (
            <Badge variant="outline" className="flex items-center gap-1">
              Responsável: {responsibleOptions.find((o) => o.value === filters.responsible)?.label}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleResponsibleChange("all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
