import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { AdminUsersTable } from "@/components/AdminUsersTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock, Users, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Página de painel de administração
 * Apenas admins podem aceder
 */
export default function AdminPanel() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <RoleProtectedRoute
      allowedRoles={["admin"]}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              Apenas administradores podem aceder a este painel.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
          <p className="text-muted-foreground mt-2">
            Gerir utilizadores, papéis e permissões do sistema
          </p>
        </div>

        {/* Alert de segurança */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso de Segurança</AlertTitle>
          <AlertDescription>
            Todas as alterações realizadas neste painel são registadas para auditoria.
            Utilize este painel com cuidado e responsabilidade.
          </AlertDescription>
        </Alert>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilizadores
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Settings className="h-4 w-4" />
              Permissões
            </TabsTrigger>
          </TabsList>

          {/* Tab: Utilizadores */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Utilizadores</CardTitle>
                <CardDescription>
                  Visualizar e gerir utilizadores do sistema, seus papéis e status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsersTable onEditUser={setSelectedUserId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Permissões */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Papéis e Permissões</CardTitle>
                <CardDescription>
                  Informação sobre os diferentes papéis e suas permissões
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-600"></span>
                    Admin
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso total ao sistema. Pode gerir utilizadores, papéis, permissões e
                    configurações.
                  </p>
                  <ul className="text-sm space-y-1 ml-4 text-muted-foreground list-disc">
                    <li>Gerir utilizadores e papéis</li>
                    <li>Visualizar logs de auditoria</li>
                    <li>Configurar permissões</li>
                    <li>Aceder a todas as funcionalidades</li>
                  </ul>
                </div>

                {/* User */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                    Utilizador
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso padrão ao sistema. Pode criar e gerir projetos, mas não pode
                    gerir utilizadores.
                  </p>
                  <ul className="text-sm space-y-1 ml-4 text-muted-foreground list-disc">
                    <li>Criar e editar projetos</li>
                    <li>Visualizar dados de projetos</li>
                    <li>Colaborar em tarefas</li>
                    <li>Não pode gerir utilizadores</li>
                  </ul>
                </div>

                {/* Client */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-600"></span>
                    Cliente
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acesso restrito. Pode visualizar apenas informações públicas e seus
                    próprios dados.
                  </p>
                  <ul className="text-sm space-y-1 ml-4 text-muted-foreground list-disc">
                    <li>Visualizar informações públicas</li>
                    <li>Visualizar seus próprios dados</li>
                    <li>Não pode criar projetos</li>
                    <li>Acesso muito limitado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
}
