import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Plus,
  Trash2,
  Clock,
  Mail,
  Shield,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function HumanResources() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(2026);
  
  // Dialog states
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<number | null>(null);
  
  // Form states
  const [absenceForm, setAbsenceForm] = useState({
    type: "vacation" as "vacation" | "sick" | "personal" | "other",
    startDate: "",
    endDate: "",
    reason: "",
  });
  
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "national" as "national" | "regional" | "company",
    isRecurring: true,
  });
  
  const [rejectionReason, setRejectionReason] = useState("");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Apenas administradores podem aceder à gestão de Recursos Humanos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Queries
  const { data: team = [] } = trpc.hr.team.list.useQuery();
  const { data: pendingAbsences = [] } = trpc.hr.absences.pending.useQuery();
  const { data: allAbsences = [] } = trpc.hr.absences.list.useQuery();
  const { data: holidays = [] } = trpc.hr.holidays.list.useQuery({ year: selectedYear });
  const { data: metrics } = trpc.hr.metrics.absences.useQuery({ year: selectedYear });

  // Mutations
  const utils = trpc.useUtils();
  
  const approveAbsenceMutation = trpc.hr.absences.approve.useMutation({
    onSuccess: () => {
      toast({ title: "Pedido aprovado", description: "O pedido de ausência foi aprovado com sucesso." });
      utils.hr.absences.pending.invalidate();
      utils.hr.absences.list.invalidate();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const rejectAbsenceMutation = trpc.hr.absences.reject.useMutation({
    onSuccess: () => {
      toast({ title: "Pedido rejeitado", description: "O pedido de ausência foi rejeitado." });
      utils.hr.absences.pending.invalidate();
      utils.hr.absences.list.invalidate();
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const createHolidayMutation = trpc.hr.holidays.create.useMutation({
    onSuccess: () => {
      toast({ title: "Feriado adicionado", description: "O feriado foi adicionado com sucesso." });
      utils.hr.holidays.list.invalidate();
      setIsHolidayDialogOpen(false);
      setHolidayForm({ name: "", date: "", type: "national", isRecurring: true });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteHolidayMutation = trpc.hr.holidays.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Feriado removido", description: "O feriado foi removido com sucesso." });
      utils.hr.holidays.list.invalidate();
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleApprove = (id: number) => {
    approveAbsenceMutation.mutate({ id });
  };

  const handleReject = (id: number) => {
    setSelectedAbsenceId(id);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedAbsenceId && rejectionReason.trim()) {
      rejectAbsenceMutation.mutate({
        id: selectedAbsenceId,
        rejectionReason: rejectionReason.trim(),
      });
    }
  };

  const handleCreateHoliday = () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    createHolidayMutation.mutate({
      ...holidayForm,
      year: selectedYear,
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "vacation":
        return <Badge variant="outline">Férias</Badge>;
      case "sick":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Doença</Badge>;
      case "personal":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Pessoal</Badge>;
      case "other":
        return <Badge variant="outline">Outro</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
          <p className="text-muted-foreground mt-2">
            Gestão de colaboradores, ausências e timesheets
          </p>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equipa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.length}</div>
              <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAbsences.length}</div>
              <p className="text-xs text-muted-foreground">Aguardam aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausências {selectedYear}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalByType.reduce((sum, t) => sum + Number(t.count), 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total de pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Aprovação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalByStatus.length
                  ? Math.round(
                      ((metrics.totalByStatus.find((s) => s.status === "approved")?.count || 0) /
                        metrics.totalByStatus.reduce((sum, s) => sum + Number(s.count), 0)) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Pedidos aprovados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="team" className="space-y-4">
          <TabsList>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Equipa ({team.length})
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovações ({pendingAbsences.length})
            </TabsTrigger>
            <TabsTrigger value="management">
              <Calendar className="h-4 w-4 mr-2" />
              Gestão RH
            </TabsTrigger>
          </TabsList>

          {/* Tab: Equipa */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipa</CardTitle>
                <CardDescription>
                  Lista completa dos {team.length} colaboradores registados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role === "admin" ? "Administrador" : "Utilizador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Aprovações */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos de Ausência Pendentes</CardTitle>
                <CardDescription>
                  {pendingAbsences.length} pedidos aguardam aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAbsences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ✓ Sem pedidos pendentes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAbsences.map((absence) => (
                        <TableRow key={absence.id}>
                          <TableCell className="font-medium">{absence.userName}</TableCell>
                          <TableCell>{getTypeBadge(absence.type)}</TableCell>
                          <TableCell>
                            {new Date(absence.startDate).toLocaleDateString("pt-PT")} -{" "}
                            {new Date(absence.endDate).toLocaleDateString("pt-PT")}
                          </TableCell>
                          <TableCell>{absence.days} dias</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {absence.reason || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(absence.id)}
                                disabled={approveAbsenceMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(absence.id)}
                                disabled={rejectAbsenceMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* All Absences History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Ausências</CardTitle>
                <CardDescription>Todos os pedidos de ausência registados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data Pedido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAbsences.slice(0, 10).map((absence) => (
                      <TableRow key={absence.id}>
                        <TableCell className="font-medium">{absence.userName}</TableCell>
                        <TableCell>{getTypeBadge(absence.type)}</TableCell>
                        <TableCell>
                          {new Date(absence.startDate).toLocaleDateString("pt-PT")} -{" "}
                          {new Date(absence.endDate).toLocaleDateString("pt-PT")}
                        </TableCell>
                        <TableCell>{absence.days} dias</TableCell>
                        <TableCell>{getStatusBadge(absence.status)}</TableCell>
                        <TableCell>
                          {new Date(absence.createdAt).toLocaleDateString("pt-PT")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gestão RH */}
          <TabsContent value="management" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feriados Portugal {selectedYear}</CardTitle>
                    <CardDescription>
                      Gestão de encerramento de feriados nacionais
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsHolidayDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Feriado
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Recorrente</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>
                          {new Date(holiday.date).toLocaleDateString("pt-PT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              holiday.type === "national"
                                ? "default"
                                : holiday.type === "company"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {holiday.type === "national"
                              ? "Nacional"
                              : holiday.type === "company"
                              ? "Empresa"
                              : "Regional"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {holiday.isRecurring ? "Sim" : "Não"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHolidayMutation.mutate({ id: holiday.id })}
                            disabled={deleteHolidayMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Reject Absence */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Pedido de Ausência</DialogTitle>
            <DialogDescription>
              Por favor, indique o motivo da rejeição deste pedido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectAbsenceMutation.isPending}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Holiday */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Feriado</DialogTitle>
            <DialogDescription>
              Adicione um novo feriado ao calendário de {selectedYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="holiday-name">Nome do Feriado</Label>
              <Input
                id="holiday-name"
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="Ex: Dia da Liberdade"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="holiday-date">Data</Label>
              <Input
                id="holiday-date"
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="holiday-type">Tipo</Label>
              <Select
                value={holidayForm.type}
                onValueChange={(value: "national" | "regional" | "company") =>
                  setHolidayForm({ ...holidayForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Nacional</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="holiday-recurring"
                checked={holidayForm.isRecurring}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="holiday-recurring" className="cursor-pointer">
                Feriado recorrente (repete anualmente)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateHoliday}
              disabled={createHolidayMutation.isPending}
            >
              Adicionar Feriado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
