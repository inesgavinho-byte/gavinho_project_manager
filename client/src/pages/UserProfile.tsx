import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User, Calendar, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "As suas informações foram guardadas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, introduza um nome válido.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate({ name: name.trim() });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil de Utilizador</h1>
          <p className="text-muted-foreground mt-2">
            Gerir as suas informações pessoais e preferências
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Introduza o seu nome"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                      {user.name}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                    {user.email}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado (usado para autenticação OAuth)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Função
                  </Label>
                  <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 capitalize">
                    {user.role === "admin" ? "Administrador" : "Utilizador"}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Último Acesso
                  </Label>
                  <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                    {user.lastSignedIn
                      ? new Date(user.lastSignedIn).toLocaleString("pt-PT")
                      : "Nunca"}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Alterações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(user.name);
                      setIsEditing(false);
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>
              Informações sobre autenticação e segurança da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Autenticação OAuth</p>
                <p className="text-sm text-muted-foreground">
                  A sua conta utiliza autenticação OAuth da Manus. Não existem passwords
                  manuais - o acesso é feito de forma segura através do sistema OAuth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
