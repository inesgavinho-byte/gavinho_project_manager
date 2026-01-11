import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  Activity, 
  BarChart3, 
  Edit, 
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Linkedin,
  Globe,
  Briefcase,
  Building2,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";
import { UserPreferences } from "@/components/profile/UserPreferences";
import { ActivityTimeline } from "@/components/profile/ActivityTimeline";
import { UserStats } from "@/components/profile/UserStats";

export default function UserProfile() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading, refetch: refetchUser } = trpc.userProfile.getMyProfile.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.userProfile.getMyStats.useQuery();
  const { data: preferences, isLoading: prefsLoading } = trpc.userProfile.getMyPreferences.useQuery();

  if (userLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Perfil não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-300";
      case "client":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "client":
        return "Cliente";
      default:
        return "Utilizador";
    }
  };

  const handleProfileUpdated = () => {
    refetchUser();
    setEditDialogOpen(false);
    toast({
      title: "Perfil atualizado",
      description: "As suas informações foram guardadas com sucesso.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-8 space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              {/* Left: Avatar and Basic Info */}
              <div className="flex gap-6 flex-1">
                {/* Avatar */}
                <div className="relative group flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-gray-200 shadow-md">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-[#C9A882] to-[#ADAA96] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity border-gray-300"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>

                {/* Name and Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">{user.name || "Sem nome"}</h1>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-600 font-medium">{user.jobTitle || "Sem cargo"}</span>
                    <Badge className={`${getRoleBadgeColor(user.role)} border`}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{user.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Holidays Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 min-w-[200px] text-center">
                <div className="text-4xl font-bold text-green-700 mb-1">
                  {stats?.holidaysAvailable || 0}
                </div>
                <div className="text-sm text-green-700 font-medium mb-2">dias férias disponíveis</div>
                <div className="text-xs text-green-600">
                  {stats?.pendingRequests || 0} pedidos • {stats?.approvedRequests || 0} encargos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 h-auto gap-1">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-[#C9A882] rounded-none border-b-2 border-transparent"
            >
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="holidays" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-[#C9A882] rounded-none border-b-2 border-transparent"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Férias e Ausências
            </TabsTrigger>
            <TabsTrigger 
              value="receipts" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-[#C9A882] rounded-none border-b-2 border-transparent"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Recibos
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-[#C9A882] rounded-none border-b-2 border-transparent"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendário
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-[#C9A882] rounded-none border-b-2 border-transparent"
            >
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dados Pessoais */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Dados Pessoais</h2>
                
                {/* Personal Data Form */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        value={user.name || ""}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={user.email || ""}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={user.phone || ""}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                      <input
                        type="text"
                        value={user.dateOfBirth ? format(new Date(user.dateOfBirth), "dd/MM/yyyy") : ""}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Morada</label>
                    <input
                      type="text"
                      value={user.location || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => setEditDialogOpen(true)}
                      className="bg-gray-700 hover:bg-gray-800 text-white rounded-full px-8"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Guardar Alterações
                    </Button>
                  </div>
                </div>

                {/* Professional Information */}
                <Separator className="my-8 bg-gray-200" />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4">Informação Profissional (gerida pela administração)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Position */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Cargo</p>
                      <p className="text-gray-800 font-medium">{user.jobTitle || "—"}</p>
                    </div>

                    {/* Department */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Departamento</p>
                      <p className="text-gray-800 font-medium">{user.department || "—"}</p>
                    </div>

                    {/* Start Date */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-1">Data de Entrada</p>
                      <p className="text-gray-800 font-medium">
                        {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Férias e Ausências */}
          <TabsContent value="holidays" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Férias e Ausências</h2>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Recibos */}
          <TabsContent value="receipts" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Recibos</h2>
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calendário */}
          <TabsContent value="calendar" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Calendário</h2>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Segurança</h2>
                
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Alterar Password</p>
                        <p className="text-sm text-gray-600">Atualize a sua password regularmente</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setPasswordDialogOpen(true)}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Alterar
                    </Button>
                  </div>

                  {/* Two Factor Authentication */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Autenticação de Dois Fatores</p>
                        <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-gray-300"
                      disabled
                    >
                      Em breve
                    </Button>
                  </div>

                  {/* Active Sessions */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">Sessões Ativas</p>
                        <p className="text-sm text-gray-600">Gerencie os seus dispositivos conectados</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      className="border-gray-300"
                      disabled
                    >
                      Em breve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        onSuccess={handleProfileUpdated}
      />

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <ProfilePictureUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentPicture={user.profilePicture}
        onSuccess={() => {
          refetchUser();
          setUploadDialogOpen(false);
          toast({
            title: "Foto de perfil atualizada",
            description: "A sua foto foi guardada com sucesso.",
          });
        }}
      />
    </DashboardLayout>
  );
}
