import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export interface ProjectAdvancedFilters {
  clientName?: string;
  location?: string;
  status?: string;
  priority?: string;
  minProgress?: number;
  maxProgress?: number;
  minBudget?: number;
  maxBudget?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

export interface ConstructionAdvancedFilters {
  code?: string;
  projectName?: string;
  location?: string;
  status?: string;
  priority?: string;
  minProgress?: number;
  maxProgress?: number;
  minBudget?: number;
  maxBudget?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

interface ProjectFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: ProjectAdvancedFilters) => void;
  initialFilters?: ProjectAdvancedFilters;
}

interface ConstructionFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: ConstructionAdvancedFilters) => void;
  initialFilters?: ConstructionAdvancedFilters;
}

export function ProjectAdvancedFiltersModal({
  open,
  onOpenChange,
  onApply,
  initialFilters = {},
}: ProjectFiltersModalProps) {
  const [filters, setFilters] = useState<ProjectAdvancedFilters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-dark)" }}>Filtros Avançados - Projetos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Informações Básicas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Nome do cliente"
                  value={filters.clientName || ""}
                  onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Cidade ou região"
                  value={filters.location || ""}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Estado e Prioridade */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Estado e Prioridade
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={filters.status || ""} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="gavinho-select">
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="planning">Planeamento</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={filters.priority || ""} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="gavinho-select">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Progresso (%)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minProgress">Mínimo</Label>
                <Input
                  id="minProgress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.minProgress || ""}
                  onChange={(e) => setFilters({ ...filters, minProgress: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="maxProgress">Máximo</Label>
                <Input
                  id="maxProgress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.maxProgress || ""}
                  onChange={(e) => setFilters({ ...filters, maxProgress: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Orçamento */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Orçamento (€)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minBudget">Mínimo</Label>
                <Input
                  id="minBudget"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.minBudget || ""}
                  onChange={(e) => setFilters({ ...filters, minBudget: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="maxBudget">Máximo</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  min="0"
                  placeholder="Sem limite"
                  value={filters.maxBudget || ""}
                  onChange={(e) => setFilters({ ...filters, maxBudget: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Datas de Início */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Data de Início
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDateFrom">De</Label>
                <Input
                  id="startDateFrom"
                  type="date"
                  value={filters.startDateFrom || ""}
                  onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="startDateTo">Até</Label>
                <Input
                  id="startDateTo"
                  type="date"
                  value={filters.startDateTo || ""}
                  onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Datas de Fim */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Data de Fim
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDateFrom">De</Label>
                <Input
                  id="endDateFrom"
                  type="date"
                  value={filters.endDateFrom || ""}
                  onChange={(e) => setFilters({ ...filters, endDateFrom: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="endDateTo">Até</Label>
                <Input
                  id="endDateTo"
                  type="date"
                  value={filters.endDateTo || ""}
                  onChange={(e) => setFilters({ ...filters, endDateTo: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              style={{ background: "var(--warm-beige)", color: "white" }}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConstructionAdvancedFiltersModal({
  open,
  onOpenChange,
  onApply,
  initialFilters = {},
}: ConstructionFiltersModalProps) {
  const [filters, setFilters] = useState<ConstructionAdvancedFilters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-dark)" }}>Filtros Avançados - Obras</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Informações Básicas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código da Obra</Label>
                <Input
                  id="code"
                  placeholder="GB00XXX"
                  value={filters.code || ""}
                  onChange={(e) => setFilters({ ...filters, code: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="projectName">Projeto Associado</Label>
                <Input
                  id="projectName"
                  placeholder="Nome do projeto"
                  value={filters.projectName || ""}
                  onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Cidade ou região"
                  value={filters.location || ""}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Estado e Prioridade */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Estado e Prioridade
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={filters.status || ""} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="gavinho-select">
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="not_started">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress">Em Curso</SelectItem>
                    <SelectItem value="on_hold">Em Espera</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={filters.priority || ""} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="gavinho-select">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Progresso (%)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minProgress">Mínimo</Label>
                <Input
                  id="minProgress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.minProgress || ""}
                  onChange={(e) => setFilters({ ...filters, minProgress: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="maxProgress">Máximo</Label>
                <Input
                  id="maxProgress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.maxProgress || ""}
                  onChange={(e) => setFilters({ ...filters, maxProgress: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Orçamento */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Orçamento (€)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minBudget">Mínimo</Label>
                <Input
                  id="minBudget"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.minBudget || ""}
                  onChange={(e) => setFilters({ ...filters, minBudget: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="maxBudget">Máximo</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  min="0"
                  placeholder="Sem limite"
                  value={filters.maxBudget || ""}
                  onChange={(e) => setFilters({ ...filters, maxBudget: parseInt(e.target.value) || undefined })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Datas de Início */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Data de Início
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDateFrom">De</Label>
                <Input
                  id="startDateFrom"
                  type="date"
                  value={filters.startDateFrom || ""}
                  onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="startDateTo">Até</Label>
                <Input
                  id="startDateTo"
                  type="date"
                  value={filters.startDateTo || ""}
                  onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>

          {/* Datas de Fim */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm" style={{ color: "var(--text-dark)" }}>
              Data de Fim Prevista
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDateFrom">De</Label>
                <Input
                  id="endDateFrom"
                  type="date"
                  value={filters.endDateFrom || ""}
                  onChange={(e) => setFilters({ ...filters, endDateFrom: e.target.value })}
                  className="gavinho-input"
                />
              </div>
              <div>
                <Label htmlFor="endDateTo">Até</Label>
                <Input
                  id="endDateTo"
                  type="date"
                  value={filters.endDateTo || ""}
                  onChange={(e) => setFilters({ ...filters, endDateTo: e.target.value })}
                  className="gavinho-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              style={{ background: "var(--warm-beige)", color: "white" }}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
