import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Users, 
  FileText, 
  Image as ImageIcon,
  Euro,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle
} from "lucide-react";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;

  const { data: statsData, isLoading } = trpc.projects.getStats.useQuery({ id: projectId });
  const { data: phases } = trpc.projects.phases.list.useQuery({ projectId });
  const { data: milestones } = trpc.projects.milestones.list.useQuery({ projectId });

  const project = statsData?.project;
  const stats = statsData?.stats;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
      in_progress: "bg-[#C3BAAF]/10 text-[#5F5C59] border-[#C3BAAF]/20",
      on_hold: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: "Planeamento",
      in_progress: "Em Andamento",
      on_hold: "Em Espera",
      completed: "Concluído",
      cancelled: "Cancelado",
      not_started: "Não Iniciado",
      pending: "Pendente",
      overdue: "Atrasado",
    };
    return labels[status] || status;
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "in_progress":
        return <Circle className="w-5 h-5 text-[#C9A882] fill-[#C9A882]" />;
      case "on_hold":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Circle className="w-5 h-5 text-[#5F5C59]/20" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C9A882] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#5F5C59]/60">A carregar projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="font-serif text-2xl text-[#5F5C59]">Projeto não encontrado</h2>
          <Link href="/projects">
            <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects">
          <Button variant="ghost" className="mb-4 text-[#5F5C59]/60 hover:text-[#5F5C59]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Projetos
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-4xl text-[#5F5C59]">{project.name}</h1>
              <Badge className={`${getStatusColor(project.status)} border`}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            {project.clientName && (
              <p className="text-lg text-[#5F5C59]/70 mb-4">Cliente: {project.clientName}</p>
            )}
            {project.description && (
              <p className="text-[#5F5C59]/60 max-w-3xl">{project.description}</p>
            )}
          </div>
          <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
            Editar Projeto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#C9A882]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#C9A882]" />
            </div>
            <span className="text-2xl font-serif text-[#5F5C59]">{project.progress}%</span>
          </div>
          <p className="text-sm text-[#5F5C59]/60">Progresso Geral</p>
          <div className="mt-3 h-2 bg-[#EEEAE5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A882] transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#C3BAAF]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#5F5C59]" />
            </div>
            <span className="text-2xl font-serif text-[#5F5C59]">
              {stats?.completedPhases}/{stats?.totalPhases}
            </span>
          </div>
          <p className="text-sm text-[#5F5C59]/60">Fases Concluídas</p>
        </Card>

        <Card className="p-6 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-serif text-[#5F5C59]">
              {stats?.completedMilestones}/{stats?.totalMilestones}
            </span>
          </div>
          <p className="text-sm text-[#5F5C59]/60">Marcos Concluídos</p>
        </Card>

        <Card className="p-6 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-serif text-[#5F5C59]">{stats?.teamSize}</span>
          </div>
          <p className="text-sm text-[#5F5C59]/60">Membros da Equipa</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-[#C3BAAF]/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Equipa
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Galeria
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Euro className="w-4 h-4 mr-2" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Info */}
            <Card className="p-6 border-[#C3BAAF]/20 bg-white">
              <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Informações do Projeto</h3>
              <div className="space-y-4">
                {project.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#C9A882] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#5F5C59]/60 mb-1">Localização</p>
                      <p className="text-[#5F5C59]">{project.location}</p>
                    </div>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#C9A882] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#5F5C59]/60 mb-1">Datas</p>
                      <p className="text-[#5F5C59]">
                        {new Date(project.startDate).toLocaleDateString('pt-PT')}
                        {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('pt-PT')}`}
                      </p>
                    </div>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-start gap-3">
                    <Euro className="w-5 h-5 text-[#C9A882] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#5F5C59]/60 mb-1">Orçamento</p>
                      <p className="text-[#5F5C59] font-medium">
                        €{parseFloat(project.budget).toLocaleString('pt-PT')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 border-[#C3BAAF]/20 bg-white">
              <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Estatísticas Rápidas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#5F5C59]/60">Total de Documentos</span>
                  <span className="text-[#5F5C59] font-medium">{stats?.totalDocuments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5F5C59]/60">Total de Fotos</span>
                  <span className="text-[#5F5C59] font-medium">{stats?.totalPhotos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5F5C59]/60">Marcos Atrasados</span>
                  <span className={`font-medium ${stats?.overdueMilestones ? 'text-red-600' : 'text-emerald-600'}`}>
                    {stats?.overdueMilestones || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {/* Phases */}
          <Card className="p-6 border-[#C3BAAF]/20 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-[#5F5C59]">Fases do Projeto</h3>
              <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                Adicionar Fase
              </Button>
            </div>

            {phases && phases.length > 0 ? (
              <div className="space-y-4">
                {phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-start gap-4 p-4 rounded-lg border border-[#C3BAAF]/20 hover:border-[#C9A882]/40 transition-colors">
                    <div className="flex flex-col items-center">
                      {getPhaseStatusIcon(phase.status)}
                      {index < phases.length - 1 && (
                        <div className="w-0.5 h-12 bg-[#C3BAAF]/20 mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[#5F5C59]">{phase.name}</h4>
                        <Badge className={`${getStatusColor(phase.status)} border`}>
                          {getStatusLabel(phase.status)}
                        </Badge>
                      </div>
                      {phase.description && (
                        <p className="text-sm text-[#5F5C59]/60 mb-3">{phase.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-[#5F5C59]/60">
                        {phase.startDate && (
                          <span>Início: {new Date(phase.startDate).toLocaleDateString('pt-PT')}</span>
                        )}
                        {phase.endDate && (
                          <span>Fim: {new Date(phase.endDate).toLocaleDateString('pt-PT')}</span>
                        )}
                        <span>Progresso: {phase.progress}%</span>
                      </div>
                      <div className="mt-3 h-2 bg-[#EEEAE5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C9A882] transition-all"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#5F5C59]/60">
                Nenhuma fase criada ainda
              </div>
            )}
          </Card>

          {/* Milestones */}
          <Card className="p-6 border-[#C3BAAF]/20 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-[#5F5C59]">Marcos Importantes</h3>
              <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                Adicionar Marco
              </Button>
            </div>

            {milestones && milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 rounded-lg border border-[#C3BAAF]/20 hover:border-[#C9A882]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : milestone.status === "overdue" ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#5F5C59]/20" />
                      )}
                      <div>
                        <h4 className="font-medium text-[#5F5C59]">{milestone.name}</h4>
                        {milestone.description && (
                          <p className="text-sm text-[#5F5C59]/60">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-[#5F5C59]/60">Data Prevista</p>
                        <p className="text-sm font-medium text-[#5F5C59]">
                          {new Date(milestone.dueDate).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(milestone.status)} border`}>
                        {getStatusLabel(milestone.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#5F5C59]/60">
                Nenhum marco criado ainda
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Other tabs placeholders */}
        <TabsContent value="team">
          <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
            <p className="text-[#5F5C59]/60">Tab Equipa em desenvolvimento...</p>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
            <p className="text-[#5F5C59]/60">Tab Documentos em desenvolvimento...</p>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
            <p className="text-[#5F5C59]/60">Tab Galeria em desenvolvimento...</p>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
            <p className="text-[#5F5C59]/60">Tab Financeiro em desenvolvimento...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
