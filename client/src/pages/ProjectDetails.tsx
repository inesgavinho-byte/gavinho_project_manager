import { useState, useRef, useEffect } from "react";
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
  X,
  Folder,
  Package,
  FileSignature
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProjectDocuments from "@/components/ProjectDocuments";
import ProjectManagementDocs from "@/components/ProjectManagementDocs";
import { BudgetManagement } from "@/components/BudgetManagement";
import ProjectGallery from "@/components/ProjectGallery";
import { DeliveryCenter } from "@/components/DeliveryCenter";
import { ProjectGanttChart } from "@/components/ProjectGanttChart";
import { ProjectArchvizGallery } from "@/components/ProjectArchvizGallery";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { ContractUpload } from "@/components/ContractUpload";
import { ProjectPhasesSection } from "@/components/ProjectPhasesSection";
import { ProjectLibraryTab } from "@/components/ProjectLibraryTab";
import { ProjectGanttTimeline } from "@/components/ProjectGanttTimeline";
import { ProjectMilestones } from "@/components/ProjectMilestones";
import { ProjectTeamAssignment } from "@/components/ProjectTeamAssignment";
import { useAuth } from "@/_core/hooks/useAuth";export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedExistingMember, setSelectedExistingMember] = useState<number | null>(null);
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  
  // Get member history when a member is selected
  const { data: memberHistory } = trpc.projects.team.getMemberHistory.useQuery(
    { userId: selectedExistingMember! },
    { enabled: !!selectedExistingMember }
  );

  // Sync isAddingNewMember when dialog opens
  useEffect(() => {
    if (isAddMemberOpen && !selectedExistingMember) {
      setIsAddingNewMember(true);
    }
  }, [isAddMemberOpen, selectedExistingMember]);
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
  const { data: allMembers } = trpc.projects.team.listAllMembers.useQuery();
  const { data: documents, refetch: refetchDocuments } = trpc.projects.documents.list.useQuery({ projectId });
  const { data: gallery, refetch: refetchGallery } = trpc.projects.gallery.list.useQuery({ projectId });

  const addTeamMember = trpc.projects.team.add.useMutation({
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
      setIsAddMemberOpen(false);
      setSelectedExistingMember(null);
      setIsAddingNewMember(false);
      setMemberSearchQuery("");
      setNewMember({ name: "", email: "", phone: "", role: "engineer" });
      refetchTeam();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar membro: " + error.message);
    },
  });

  const createAndAddMember = trpc.projects.team.createAndAdd.useMutation({
    onSuccess: () => {
      toast.success("Novo membro criado e adicionado com sucesso!");
      setIsAddMemberOpen(false);
      setSelectedExistingMember(null);
      setIsAddingNewMember(false);
      setMemberSearchQuery("");
      setNewMember({ name: "", email: "", phone: "", role: "engineer" });
      refetchTeam();
    },
    onError: (error) => {
      toast.error("Erro ao criar membro: " + error.message);
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

  const handleUpdateProject = (data: any) => {
    // Aqui você chamaria a mutação tRPC para atualizar o projeto
    toast.success("Projeto atualizado com sucesso!");
  };

  const handleAddPhase = (newPhase: any) => {
    // Aqui você chamaria a mutação tRPC para criar a fase
    toast.success("Fase adicionada com sucesso!");
  };

  const handleUpdatePhase = (id: number, data: any) => {
    // Aqui você chamaria a mutação tRPC para atualizar a fase
    toast.success("Fase atualizada com sucesso!");
  };

  const handleDeletePhase = (id: number) => {
    // Aqui você chamaria a mutação tRPC para deletar a fase
    toast.success("Fase removida com sucesso!");
  };

  const handleReorderPhases = (reorderedPhases: any[]) => {
    // Aqui você chamaria a mutação tRPC para reordenar as fases
    toast.success("Fases reordenadas com sucesso!");
  };

  const handleAddMember = () => {
    if (selectedExistingMember) {
      // Adding existing member
      const member = allMembers?.find(m => m.userId === selectedExistingMember);
      if (!member) {
        toast.error("Membro não encontrado");
        return;
      }
      addTeamMember.mutate({ 
        projectId, 
        userId: member.userId,
        role: newMember.role,
      });
    } else if (isAddingNewMember) {
      // Creating new member
      if (!newMember.name || !newMember.email) {
        toast.error("Nome e email são obrigatórios");
        return;
      }
      createAndAddMember.mutate({
        projectId,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone || undefined,
        role: newMember.role,
      });
    } else {
      toast.error("Selecione um membro ou escolha adicionar novo");
    }
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
            <Button 
              className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
              onClick={() => setIsEditDialogOpen(true)}
            >
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-[#C9A882]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#C9A882]" />
            </div>
            <span className="text-xl font-serif text-[#5F5C59]">{project.progress}%</span>
          </div>
          <p className="text-xs text-[#5F5C59]/60">Progresso Geral</p>
          <div className="mt-2 h-1.5 bg-[#EEEAE5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A882] transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-[#C3BAAF]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#5F5C59]" />
            </div>
            <span className="text-xl font-serif text-[#5F5C59]">
              {stats?.completedPhases}/{stats?.totalPhases}
            </span>
          </div>
          <p className="text-xs text-[#5F5C59]/60">Fases Concluídas</p>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xl font-serif text-[#5F5C59]">
              {stats?.completedMilestones}/{stats?.totalMilestones}
            </span>
          </div>
          <p className="text-xs text-[#5F5C59]/60">Marcos Concluídos</p>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-serif text-[#5F5C59]">{stats?.teamSize}</span>
          </div>
          <p className="text-xs text-[#5F5C59]/60">Membros da Equipa</p>
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
          {!isClient && (
            <TabsTrigger value="team" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Equipa
            </TabsTrigger>
          )}
          <TabsTrigger value="documents" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Design Review
          </TabsTrigger>
          {!isClient && (
            <TabsTrigger value="management" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
              <Folder className="w-4 h-4 mr-2" />
              Gestão de Projeto
            </TabsTrigger>
          )}
          <TabsTrigger value="gallery" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Briefing
          </TabsTrigger>
          <TabsTrigger value="archiviz" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Archiviz
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="briefing" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Briefing
          </TabsTrigger>
          <TabsTrigger value="phases-config" className="data-[state=active]:bg-[#C9A882] data-[state=active]:text-white">
            <Layers className="w-4 h-4 mr-2" />
            Fases
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
          <Tabs defaultValue="gantt" className="space-y-6">
            <TabsList className="bg-[#EEEAE5]/50 border border-[#C3BAAF]/20">
              <TabsTrigger value="gantt" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                Timeline Gantt
              </TabsTrigger>
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

            {/* Sub-tab: Timeline Gantt */}
            <TabsContent value="gantt" className="space-y-6">
              <Card className="p-6 border-[#C3BAAF]/20 bg-white">
                <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Timeline Visual do Projeto</h3>
                <ProjectGanttChart projectId={projectId} />
              </Card>
              {phases && phases.length > 0 && (
                <ProjectGanttTimeline
                  phases={phases.map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status as 'planning' | 'in_progress' | 'completed' | 'on_hold',
                    startDate: p.startDate,
                    endDate: p.endDate,
                    progress: p.progress || 0,
                  }))}
                  projectStartDate={project?.startDate}
                  projectEndDate={project?.endDate}
                />
              )}
            </TabsContent>

            {/* Sub-tab: Fases */}
            <TabsContent value="phases" className="space-y-6">
              <ProjectPhasesSection projectId={projectId} />
              {phases && (
                <ProjectMilestones
                  projectId={projectId}
                  milestones={milestones}
                  onAddMilestone={(milestone) => {
                    // Handler para adicionar marco
                  }}
                  onDeleteMilestone={(id) => {
                    // Handler para deletar marco
                  }}
                />
              )}
              {phases && teamMembers && (
                <ProjectTeamAssignment
                  projectId={projectId}
                  phases={phases}
                  teamMembers={teamMembers}
                  assignments={[]}
                  onAddAssignment={(assignment) => {
                    // Handler para adicionar atribuição
                  }}
                  onDeleteAssignment={(id) => {
                    // Handler para deletar atribuição
                  }}
                />
              )}
            </TabsContent>

            {/* Sub-tab: Responsabilidades */}
            <TabsContent value="responsibilities" className="space-y-6">
              <Card className="p-6 border-[#C3BAAF]/20 bg-white">
                <h3 className="font-serif text-2xl text-[#5F5C59] mb-6">Responsabilidades por Fase</h3>
                <div className="space-y-6">
                  {phases?.map((phase) => {
                    const membersByRole = teamMembers?.reduce((acc, member) => {
                      if (!acc[member.role]) {
                        acc[member.role] = [];
                      }
                      acc[member.role].push(member);
                      return acc;
                    }, {} as Record<string, typeof teamMembers>) || {};

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
                                        {member.userName ? member.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-[#5F5C59] truncate">{member.userName || 'Nome não disponível'}</p>
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
                      Selecione um membro existente ou adicione um novo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Search field */}
                    {allMembers && allMembers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="member-search" className="text-[#5F5C59]">Pesquisar Membro</Label>
                        <Input
                          id="member-search"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="Digite nome ou email..."
                          className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="member-select" className="text-[#5F5C59]">Selecionar Membro</Label>
                      <Select 
                        value={selectedExistingMember?.toString() || (isAddingNewMember ? "new" : "new")} 
                        onValueChange={(value) => {
                          if (value === "new") {
                            setSelectedExistingMember(null);
                            setIsAddingNewMember(true);
                          } else {
                            setSelectedExistingMember(parseInt(value));
                            setIsAddingNewMember(false);
                            // Pre-fill name and email from selected member
                            const member = allMembers?.find(m => m.userId === parseInt(value));
                            if (member) {
                              setNewMember(prev => ({
                                ...prev,
                                name: member.name || "",
                                email: member.email || "",
                              }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                          <SelectValue placeholder="Selecione um membro..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allMembers && allMembers.length > 0 && (
                            <>
                              {allMembers
                                .filter(member => {
                                  if (!memberSearchQuery) return true;
                                  const query = memberSearchQuery.toLowerCase();
                                  return (
                                    member.name?.toLowerCase().includes(query) ||
                                    member.email?.toLowerCase().includes(query)
                                  );
                                })
                                .map((member) => (
                                  <SelectItem key={member.userId} value={member.userId.toString()}>
                                    {member.name} ({member.email})
                                  </SelectItem>
                                ))}
                              <SelectItem value="new">+ Adicionar Novo Membro</SelectItem>
                            </>
                          )}
                          {(!allMembers || allMembers.length === 0) && (
                            <SelectItem value="new">+ Adicionar Novo Membro</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {isAddingNewMember && (
                      <>
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
                      </>
                    )}

                    {selectedExistingMember && (
                      <div className="p-4 bg-[#EEEAE5] rounded-lg space-y-3">
                        <div>
                          <p className="text-sm text-[#5F5C59]">
                            <strong>Nome:</strong> {newMember.name}<br />
                            <strong>Email:</strong> {newMember.email}
                          </p>
                        </div>
                        
                        {memberHistory && memberHistory.length > 0 && (
                          <div className="border-t border-[#C3BAAF]/20 pt-3">
                            <p className="text-xs font-semibold text-[#5F5C59] mb-2">Histórico de Projetos:</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {memberHistory.map((project, idx) => (
                                <div key={idx} className="text-xs text-[#5F5C59]/80">
                                  <span className="font-medium">{project.projectName}</span>
                                  {" "}- {project.role}
                                  {project.isActive === 1 && (
                                    <span className="ml-2 text-emerald-600 font-medium">(Ativo)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                      onClick={() => {
                        setIsAddMemberOpen(false);
                        setSelectedExistingMember(null);
                        setIsAddingNewMember(false);
                        setMemberSearchQuery("");
                        setNewMember({ name: "", email: "", phone: "", role: "engineer" });
                      }}
                      className="border-[#C3BAAF]/20"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={addTeamMember.isPending || createAndAddMember.isPending}
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

        {/* Management Tab with Sub-tabs - Restricted Access */}
        <TabsContent value="management" className="space-y-6">
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="bg-[#EEEAE5]/50 border border-[#C3BAAF]/20">
              <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                <Folder className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="financial" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                  <Euro className="w-4 h-4 mr-2" />
                  Financeiro
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="contract" className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Contrato
                </TabsTrigger>
              )}
            </TabsList>

            {/* Sub-tab: Documentos */}
            <TabsContent value="documents">
              <ProjectManagementDocs projectId={projectId} />
            </TabsContent>

            {/* Sub-tab: Financeiro - Admin Only */}
            {isAdmin && (
              <TabsContent value="financial">
                <BudgetManagement projectId={projectId} />
              </TabsContent>
            )}

            {/* Sub-tab: Contrato - Admin Only */}
            {isAdmin && (
              <TabsContent value="contract" className="space-y-6">
                {/* Contract Upload */}
                <ContractUpload 
                  projectId={projectId} 
                  onUploadComplete={() => {
                    // Refresh project data after upload
                    window.location.reload();
                  }}
                />

                <Card className="p-8 border-[#C3BAAF]/20 bg-white">
                  <div className="space-y-8">
                  {/* Header */}
                  <div className="border-b border-[#C3BAAF]/20 pb-6">
                    <h2 className="font-serif text-3xl text-[#5F5C59] mb-2">Informações do Contrato</h2>
                    <p className="text-[#5F5C59]/70">Dados contratuais, prazos e documentação</p>
                  </div>

                  {/* Contract Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Valor Contratual */}
                    <div className="space-y-2">
                      <Label className="text-[#5F5C59] font-medium">Valor Contratual</Label>
                      <div className="flex items-center gap-2">
                        <Euro className="w-5 h-5 text-[#C9A882]" />
                        <span className="text-2xl font-serif text-[#5F5C59]">
                          {project?.contractValue 
                            ? `€${parseFloat(project.contractValue).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'Não definido'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Tipo de Contrato */}
                    <div className="space-y-2">
                      <Label className="text-[#5F5C59] font-medium">Tipo de Serviço</Label>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#C9A882]" />
                        <span className="text-lg text-[#5F5C59]">
                          {project?.contractType || 'Arquitetura e Especialidades'}
                        </span>
                      </div>
                    </div>

                    {/* Data de Assinatura */}
                    <div className="space-y-2">
                      <Label className="text-[#5F5C59] font-medium">Data de Assinatura</Label>
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-[#C9A882]" />
                        <span className="text-lg text-[#5F5C59]">
                          {project?.contractSignedDate 
                            ? new Date(project.contractSignedDate).toLocaleDateString('pt-PT')
                            : 'Não definido'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Prazo Contratual */}
                    <div className="space-y-2">
                      <Label className="text-[#5F5C59] font-medium">Prazo de Execução</Label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#C9A882]" />
                        <span className="text-lg text-[#5F5C59]">
                          {project?.contractDuration || 'Não definido'}
                        </span>
                      </div>
                    </div>

                    {/* Data Limite */}
                    <div className="space-y-2">
                      <Label className="text-[#5F5C59] font-medium">Data Limite Contratual</Label>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#C9A882]" />
                        <span className="text-lg text-[#5F5C59]">
                          {project?.contractDeadline 
                            ? new Date(project.contractDeadline).toLocaleDateString('pt-PT')
                            : 'Não definido'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas do Contrato */}
                  {project?.contractNotes && (
                    <div className="space-y-3 pt-6 border-t border-[#C3BAAF]/20">
                      <Label className="text-[#5F5C59] font-medium">Notas e Observações</Label>
                      <div className="bg-[#EEEAE5]/30 rounded-lg p-4">
                        <p className="text-[#5F5C59] whitespace-pre-wrap">{project.contractNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Alertas de Prazo */}
                  {project?.contractDeadline && (
                    <div className="space-y-3 pt-6 border-t border-[#C3BAAF]/20">
                      <Label className="text-[#5F5C59] font-medium">Status do Prazo</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          const deadline = new Date(project.contractDeadline);
                          const today = new Date();
                          const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const totalDays = project.contractDuration?.match(/\d+/)?.[0] || 0;
                          const percentComplete = totalDays ? Math.min(100, Math.max(0, 100 - (daysRemaining / parseInt(totalDays as string) * 100))) : 0;

                          return (
                            <>
                              <Card className="p-4 border-[#C3BAAF]/20">
                                <div className="text-center">
                                  <p className="text-sm text-[#5F5C59]/70 mb-1">Dias Restantes</p>
                                  <p className={`text-3xl font-serif ${
                                    daysRemaining < 7 ? 'text-red-500' :
                                    daysRemaining < 30 ? 'text-orange-500' :
                                    'text-green-500'
                                  }`}>
                                    {daysRemaining > 0 ? daysRemaining : 0}
                                  </p>
                                </div>
                              </Card>
                              <Card className="p-4 border-[#C3BAAF]/20">
                                <div className="text-center">
                                  <p className="text-sm text-[#5F5C59]/70 mb-1">Progresso Temporal</p>
                                  <p className="text-3xl font-serif text-[#C9A882]">
                                    {Math.round(percentComplete)}%
                                  </p>
                                </div>
                              </Card>
                              <Card className="p-4 border-[#C3BAAF]/20">
                                <div className="text-center">
                                  <p className="text-sm text-[#5F5C59]/70 mb-1">Status</p>
                                  <Badge className={`text-sm ${
                                    daysRemaining < 0 ? 'bg-red-500' :
                                    daysRemaining < 7 ? 'bg-orange-500' :
                                    'bg-green-500'
                                  }`}>
                                    {daysRemaining < 0 ? 'Expirado' :
                                     daysRemaining < 7 ? 'Urgente' :
                                     daysRemaining < 30 ? 'Atenção' :
                                     'No Prazo'
                                    }
                                  </Badge>
                                </div>
                              </Card>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Edit Button */}
                  <div className="pt-6 border-t border-[#C3BAAF]/20">
                    <Button
                      onClick={() => setIsEditDialogOpen(true)}
                      className="bg-[#C9A882] hover:bg-[#B8956F] text-white"
                    >
                      Editar Informações do Contrato
                    </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
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
            <p className="text-sm text-gray-600 mb-6">
              Galeria consolidada de renders 3D de todas as obras associadas a este projeto
            </p>
            <ProjectArchvizGallery projectId={projectId} />
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library">
          <ProjectLibraryTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        project={project}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

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
