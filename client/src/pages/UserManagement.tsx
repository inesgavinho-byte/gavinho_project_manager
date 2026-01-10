import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Users, Shield, User, UserCog, Search, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin" | "client">("all");

  const { data: users, isLoading, refetch } = trpc.userManagement.list.useQuery();
  const updateRoleMutation = trpc.userManagement.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role atualizado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar role: ${error.message}`);
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: number, newRole: "user" | "admin" | "client") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      admin: { variant: "default", icon: Shield },
      user: { variant: "secondary", icon: User },
      client: { variant: "outline", icon: UserCog },
    };
    const config = variants[role] || variants.user;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getRoleStats = () => {
    if (!users) return { admin: 0, user: 0, client: 0, total: 0 };
    return {
      admin: users.filter((u) => u.role === "admin").length,
      user: users.filter((u) => u.role === "user").length,
      client: users.filter((u) => u.role === "client").length,
      total: users.length,
    };
  };

  const stats = getRoleStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">A carregar utilizadores...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl text-[#5F5C59] mb-2">Gestão de Utilizadores</h1>
          <p className="text-[#5F5C59]/70">Gerir roles e permissões dos membros da equipa</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#C9A882]" />
            <div>
              <p className="text-sm text-[#5F5C59]/70">Total</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#C9A882]" />
            <div>
              <p className="text-sm text-[#5F5C59]/70">Administradores</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats.admin}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-[#C9A882]" />
            <div>
              <p className="text-sm text-[#5F5C59]/70">Utilizadores</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats.user}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center gap-3">
            <UserCog className="w-8 h-8 text-[#C9A882]" />
            <div>
              <p className="text-sm text-[#5F5C59]/70">Clientes</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats.client}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-[#C3BAAF]/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5C59]/50" />
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#C3BAAF]/20"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
            <SelectTrigger className="w-full md:w-[200px] border-[#C3BAAF]/20">
              <SelectValue placeholder="Filtrar por role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="user">Utilizadores</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-[#C3BAAF]/20">
        <Table>
          <TableHeader>
            <TableRow className="border-[#C3BAAF]/20">
              <TableHead className="text-[#5F5C59]">Nome</TableHead>
              <TableHead className="text-[#5F5C59]">Email</TableHead>
              <TableHead className="text-[#5F5C59]">Role Atual</TableHead>
              <TableHead className="text-[#5F5C59]">Último Acesso</TableHead>
              <TableHead className="text-[#5F5C59]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id} className="border-[#C3BAAF]/20">
                <TableCell className="font-medium text-[#5F5C59]">
                  {user.name || "Sem nome"}
                </TableCell>
                <TableCell className="text-[#5F5C59]/70">{user.email || "-"}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="text-[#5F5C59]/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(user.lastSignedIn).toLocaleDateString("pt-PT")}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value: any) => handleRoleChange(user.id, value)}
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-[140px] border-[#C3BAAF]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-12 text-[#5F5C59]/50">
            Nenhum utilizador encontrado
          </div>
        )}
      </Card>
    </div>
  );
}
