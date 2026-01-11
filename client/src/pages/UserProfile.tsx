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
  Loader2
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
      <div className="container py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-border/40 bg-gradient-to-br from-sand/5 to-blush/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.name || "User"} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-sand to-blush text-brown">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="bg-sand/20 text-brown border-sand">
                  {user.role === "admin" ? "Administrador" : user.role === "client" ? "Cliente" : "Utilizador"}
                </Badge>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-heading text-3xl text-brown mb-1">{user.name || "Sem nome"}</h1>
                    {user.jobTitle && (
                      <p className="text-lg text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {user.jobTitle}
                        {user.department && ` · ${user.department}`}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setEditDialogOpen(true)} className="bg-brown hover:bg-brown/90">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>

                {user.bio && (
                  <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
                )}

                <Separator className="bg-border/40" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-sand" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-sand" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-sand" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.dateOfBirth && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-sand" />
                      <span>{format(new Date(user.dateOfBirth), "d 'de' MMMM 'de' yyyy", { locale: pt })}</span>
                    </div>
                  )}
                  {user.linkedin && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Linkedin className="h-4 w-4 text-sand" />
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-brown transition-colors">
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 text-sand" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-brown transition-colors">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-sand/10 border border-border/40">
            <TabsTrigger value="stats" className="data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-background">
              <Activity className="h-4 w-4 mr-2" />
              Atividade
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-background">
              <Settings className="h-4 w-4 mr-2" />
              Preferências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <UserStats stats={stats} loading={statsLoading} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityTimeline userId={user.id} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <UserPreferences 
              preferences={preferences} 
              loading={prefsLoading}
              onPasswordChange={() => setPasswordDialogOpen(true)}
            />
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
