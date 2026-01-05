import { useState, useRef } from "react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useRoute, Link, useLocation } from "wouter";
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
  AlertCircle,
  Plus,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Upload,
  Download,
  Eye,
  Filter,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectDocuments from "@/components/ProjectDocuments";
import ProjectGallery from "@/components/ProjectGallery";
import { DeliveryCenter } from "@/components/DeliveryCenter";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "engineer" as const,
  });

  // Documents state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Gallery state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: statsData, isLoading } = trpc.projects.getStats.useQuery({ id: projectId });
  const { data: phases } = trpc.projects.phases.list.useQuery({ projectId });
  const { data: milestones } = trpc.projects.milestones.list.useQuery({ projectId });
  const { data: teamMembers, refetch: refetchTeam } = trpc.projects.team.list.useQuery({ projectId });
  const { data: documents, refetch: refetchDocuments } = trpc.projects.documents.list.useQuery({ projectId });
  const { data: gallery, refetch: refetchGallery } = trpc.projects.gallery.list.useQuery({ projectId });

  const addTeamMember = trpc.projects.team.add.useMutation({
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
      setIsAddMemberOpen(false);
      setNewMember({ name: "", email: "", phone: "", role: "engineer" });
      refetchTeam();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar membro: " + error.message);
    },
  });

  const removeTeamMember = trpc.projects.team.remove.useMutation({
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
      refetchTeam();
    },
    onError: (error) => {
      toast.error("Erro ao remover membro: " + error.message);
    },
  });

  const [, setLocation] = useLocation();
  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projeto apagado com sucesso!");
      setLocation("/projects");
    },
    onError: (error) => {
      toast.error("Erro ao apagar projeto: " + error.message);
    },
  });

  const handleDeleteProject = () => {
    deleteProject.mutate({ id: projectId });
    setIsDeleteDialogOpen(false);
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    addTeamMember.mutate({ projectId, ...newMember });
  };

  const reorderTeamMembers = trpc.projects.team.reorder.useMutation({
    onSuccess: () => {
      refetchTeam();
    },
    onError: (error) => {
      toast.error("Erro ao reordenar membros: " + error.message);
      refetchTeam(); // Revert to server state
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !teamMembers) return;

    const items = Array.from(teamMembers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order for all affected members
    const updates = items.map((member, index) => ({
      memberId: member.id,
      displayOrder: index,
    }));

    // Persist order to backend
    reorderTeamMembers.mutate({ updates });
  };

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
          <div className="flex gap-2">
            <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
              Editar Projeto
            </Button>
            <Button 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Apagar
            </Button>
          </div>
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
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Fases & Entregas
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Equipa
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Design Review
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Briefing
          </TabsTrigger>
          <TabsTrigger value="archiviz" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Archiviz
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
        {/* Timeline Tab with Sub-tabs */}
        <TabsContent value="timeline" className="space-y-6">
          <Tabs defaultValue="phases" className="space-y-6">
            <TabsList className="bg-[#EEEAE5]/50 border border-[#C3BAAF]/20">
              <TabsTrigger value="phases" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Fases
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Entregáveis
              </TabsTrigger>
              <TabsTrigger value="delivery-center" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Central de Entregas
              </TabsTrigger>
            </TabsList>

            {/* Sub-tab: Fases */}
            <TabsContent value="phases" className="space-y-6">
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

          {/* Responsibilities by Phase */}
          {phases && phases.length > 0 && teamMembers && teamMembers.length > 0 && (
            <Card className="p-6 border-[#C3BAAF]/20 bg-white">
              <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Responsabilidades por Fase</h3>
              <div className="space-y-6">
                {phases.map((phase) => {
                  // Group team members by role for this phase
                  const membersByRole = teamMembers.reduce((acc, member) => {
                    if (!acc[member.role]) {
                      acc[member.role] = [];
                    }
                    acc[member.role].push(member);
                    return acc;
                  }, {} as Record<string, typeof teamMembers>);

                  const getRoleLabel = (role: string) => {
                    const labels: Record<string, string> = {
                      architect: "Arquitetos",
                      engineer: "Engenheiros",
                      project_manager: "Gestores de Projeto",
                      contractor: "Empreiteiros",
                      designer: "Designers",
                      consultant: "Consultores",
                    };
                    return labels[role] || role;
                  };

                  const getRoleColor = (role: string) => {
                    const colors: Record<string, string> = {
                      architect: "bg-purple-50 text-purple-700 border-purple-200",
                      engineer: "bg-blue-50 text-blue-700 border-blue-200",
                      project_manager: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
                      contractor: "bg-orange-50 text-orange-700 border-orange-200",
                      designer: "bg-pink-50 text-pink-700 border-pink-200",
                      consultant: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    };
                    return colors[role] || "bg-gray-50 text-gray-700 border-gray-200";
                  };

                  return (
                    <div key={phase.id} className="border border-[#C3BAAF]/20 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg text-[#5F5C59] mb-1">{phase.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-[#5F5C59]/60">
                            {phase.startDate && (
                              <span>Início: {new Date(phase.startDate).toLocaleDateString('pt-PT')}</span>
                            )}
                            {phase.endDate && (
                              <span>Fim: {new Date(phase.endDate).toLocaleDateString('pt-PT')}</span>
                            )}
                            <Badge className={`${getStatusColor(phase.status)} border`}>
                              {getStatusLabel(phase.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#5F5C59]/60 mb-1">Progresso</p>
                          <p className="text-2xl font-serif text-[#5F5C59]">{phase.progress}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {Object.entries(membersByRole).map(([role, members]) => (
                          <div key={role} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-[#C9A882]" />
                              <span className="text-sm font-medium text-[#5F5C59]">
                                {getRoleLabel(role)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {members.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 p-2 rounded border border-[#C3BAAF]/10 bg-[#EEEAE5]/30"
                                >
                                  <div className="w-8 h-8 rounded-full bg-[#C9A882]/20 flex items-center justify-center">
                                    <span className="text-xs font-medium text-[#C9A882]">
                                      {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#5F5C59] truncate">{member.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
            </TabsContent>

            {/* Sub-tab: Entregáveis */}
            <TabsContent value="deliverables" className="space-y-6">
              <Card className="p-6 border-[#C3BAAF]/20 bg-white">
                <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Entregáveis do Projeto</h3>
                <div className="text-center py-12 text-[#5F5C59]/60">
                  Lista de entregáveis por fase (em desenvolvimento)
                </div>
              </Card>
            </TabsContent>

            {/* Sub-tab: Central de Entregas */}
            <TabsContent value="delivery-center" className="space-y-6">
              <DeliveryCenter projectId={projectId} phases={phases || []} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Other tabs placeholders */}
        <TabsContent value="team" className="space-y-6">
          <Card className="p-6 border-[#C3BAAF]/20 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl text-[#5F5C59]">Equipa do Projeto</h3>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Adicionar Membro à Equipa</DialogTitle>
                    <DialogDescription className="text-[#5F5C59]/60">
                      Preencha os dados do novo membro da equipa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#5F5C59]">Nome *</Label>
                      <Input
                        id="name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Nome completo"
                        className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#5F5C59]">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[#5F5C59]">Telefone</Label>
                      <Input
                        id="phone"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        placeholder="+351 912 345 678"
                        className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-[#5F5C59]">Função *</Label>
                      <Select value={newMember.role} onValueChange={(value: any) => setNewMember({ ...newMember, role: value })}>
                        <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="architect">Arquiteto</SelectItem>
                          <SelectItem value="engineer">Engenheiro</SelectItem>
                          <SelectItem value="project_manager">Gestor de Projeto</SelectItem>
                          <SelectItem value="contractor">Empreiteiro</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="consultant">Consultor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddMemberOpen(false)}
                      className="border-[#C3BAAF]/20"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={addTeamMember.isPending}
                      className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
                    >
                      {addTeamMember.isPending ? "A adicionar..." : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teamMembers && teamMembers.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="team-members">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {teamMembers.map((member, index) => {
                  const getRoleLabel = (role: string) => {
                    const labels: Record<string, string> = {
                      architect: "Arquiteto",
                      engineer: "Engenheiro",
                      project_manager: "Gestor de Projeto",
                      contractor: "Empreiteiro",
                      designer: "Designer",
                      consultant: "Consultor",
                    };
                    return labels[role] || role;
                  };

                  const getRoleColor = (role: string) => {
                    const colors: Record<string, string> = {
                      architect: "bg-purple-50 text-purple-700 border-purple-200",
                      engineer: "bg-blue-50 text-blue-700 border-blue-200",
                      project_manager: "bg-[#C9A882]/10 text-[#C9A882] border-[#C9A882]/20",
                      contractor: "bg-orange-50 text-orange-700 border-orange-200",
                      designer: "bg-pink-50 text-pink-700 border-pink-200",
                      consultant: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    };
                    return colors[role] || "bg-gray-50 text-gray-700 border-gray-200";
                  };

                  return (
                    <Draggable key={member.id} draggableId={member.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-4 border-[#C3BAAF]/20 bg-white hover:border-[#C9A882]/40 transition-all ${
                            snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''
                          }`}
                        >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#5F5C59] mb-1">{member.name}</h4>
                          <Badge className={`${getRoleColor(member.role)} border text-xs`}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover ${member.name} da equipa?`)) {
                              removeTeamMember.mutate({ memberId: member.id });
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-[#5F5C59]/60">
                          <Briefcase className="w-4 h-4" />
                          <span>Adicionado em {new Date(member.joinedAt).toLocaleDateString('pt-PT')}</span>
                        </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#EEEAE5] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#C9A882]" />
                </div>
                <h4 className="font-serif text-xl text-[#5F5C59] mb-2">Nenhum membro na equipa</h4>
                <p className="text-[#5F5C59]/60 mb-4">Comece por adicionar membros à equipa do projeto</p>
                <Button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments projectId={projectId} />
        </TabsContent>

        {/* Briefing Tab with Sub-tabs */}
        <TabsContent value="gallery" className="space-y-6">
          <Tabs defaultValue="gallery-sub" className="space-y-6">
            <TabsList className="bg-[#EEEAE5]/50 border border-[#C3BAAF]/20">
              <TabsTrigger value="gallery-sub" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Galeria
              </TabsTrigger>
              <TabsTrigger value="conceptual-memory" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Memória Conceptual
              </TabsTrigger>
            </TabsList>

            {/* Sub-tab: Galeria */}
            <TabsContent value="gallery-sub">
              <ProjectGallery projectId={projectId} phases={phases || []} />
            </TabsContent>

            {/* Sub-tab: Memória Conceptual */}
            <TabsContent value="conceptual-memory" className="space-y-6">
              <Card className="p-6 border-[#C3BAAF]/20 bg-white">
                <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Memória Conceptual</h3>
                <div className="text-center py-12 text-[#5F5C59]/60">
                  Documentação do conceito e inspirações do projeto (em desenvolvimento)
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Archiviz Tab */}
        <TabsContent value="archiviz" className="space-y-6">
          <Card className="p-6 border-[#C3BAAF]/20 bg-white">
            <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Archiviz</h3>
            <div className="text-center py-12 text-[#5F5C59]/60">
              Renders 3D e visualizações arquitetónicas (em desenvolvimento)
            </div>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <Card className="p-12 text-center border-[#C3BAAF]/20 bg-white">
            <p className="text-[#5F5C59]/60">Tab Financeiro em desenvolvimento...</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
              Apagar Projeto?
            </DialogTitle>
            <DialogDescription className="text-[#5F5C59]/70 space-y-3 pt-4">
              <p className="font-semibold">
                Tem a certeza que deseja apagar o projeto "{project?.name}"?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="text-red-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Esta ação é irreversível!
                </p>
                <p className="text-red-700 text-sm">
                  Todos os dados relacionados serão permanentemente apagados:
                </p>
                <ul className="text-red-700 text-sm list-disc list-inside space-y-1 ml-2">
                  <li>{phases?.length || 0} fases</li>
                  <li>{milestones?.length || 0} marcos</li>
                  <li>{teamMembers?.length || 0} membros da equipa</li>
                  <li>{documents?.length || 0} documentos</li>
                  <li>{gallery?.length || 0} imagens da galeria</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-[#C3BAAF] text-[#5F5C59]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteProject.isPending ? "A apagar..." : "Sim, Apagar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
