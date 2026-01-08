import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { HardHat, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Works() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: constructions, isLoading } = trpc.constructions.list.useQuery();

  const filteredWorks = constructions?.filter(work =>
    work.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Obras</h1>
          <p className="text-muted-foreground">
            Gestão de todas as obras em execução
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar obras..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Works Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorks?.map(work => (
          <Link key={work.id} href={`/works/${work.id}`}>
            <a>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <HardHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    work.status === 'in_progress' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    work.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {work.status === 'in_progress' ? 'Em Execução' :
                     work.status === 'planned' ? 'Planeada' : 'Concluída'}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-1">{work.code}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {work.name}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{work.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${work.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {work.totalWorkers || 0} trabalhadores
                  </span>
                  <span className="text-muted-foreground">
                    {work.pendingTasks || 0} tarefas
                  </span>
                </div>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {(!filteredWorks || filteredWorks.length === 0) && (
        <Card className="p-12">
          <div className="text-center">
            <HardHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma obra encontrada</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Tente ajustar os filtros de pesquisa' : 'Comece criando a primeira obra'}
            </p>
            {!searchQuery && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Obra
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
