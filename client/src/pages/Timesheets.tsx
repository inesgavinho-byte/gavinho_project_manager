import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/_core/hooks/useAuth";
import { Clock, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function Timesheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: myTimesheets, isLoading: loadingMy } = trpc.hr.timesheets.listMy.useQuery();
  const { data: pendingTimesheets, isLoading: loadingPending } = trpc.hr.timesheets.listPending.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  const createMutation = trpc.hr.timesheets.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Timesheet registado",
        description: "As horas foram registadas com sucesso.",
      });
      setDate(new Date().toISOString().split('T')[0]);
      setProjectId("");
      setHours("");
      setDescription("");
      utils.hr.timesheets.listMy.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveMutation = trpc.hr.timesheets.approve.useMutation({
    onSuccess: () => {
      toast({
        title: "Timesheet aprovado",
        description: "O registo de horas foi aprovado.",
      });
      utils.hr.timesheets.listPending.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = trpc.hr.timesheets.reject.useMutation({
    onSuccess: () => {
      toast({
        title: "Timesheet rejeitado",
        description: "O registo de horas foi rejeitado.",
      });
      utils.hr.timesheets.listPending.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !projectId || !hours || !description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      toast({
        title: "Horas inválidas",
        description: "Por favor, introduza um número de horas válido (0-24).",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      date: new Date(date).toISOString(),
      projectId: parseInt(projectId),
      hours: hoursNum,
      description,
    });
  };

  const handleExport = () => {
    if (!myTimesheets || myTimesheets.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não existem timesheets para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Generate CSV
    const headers = ["Data", "Projeto", "Horas", "Descrição", "Status"];
    const rows = myTimesheets.map(ts => [
      new Date(ts.date).toLocaleDateString('pt-PT'),
      ts.projectCode || "N/A",
      ts.hours.toString(),
      ts.description,
      ts.status === "approved" ? "Aprovado" : ts.status === "rejected" ? "Rejeitado" : "Pendente"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `timesheets_${user?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "O ficheiro CSV foi descarregado com sucesso.",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground">
            Registe e acompanhe as suas horas de trabalho por projeto
          </p>
        </div>
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Registar Horas</TabsTrigger>
          <TabsTrigger value="my-timesheets">Meus Timesheets</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registar Horas Trabalhadas</CardTitle>
              <CardDescription>
                Preencha os detalhes das horas trabalhadas no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">Horas *</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      placeholder="Ex: 8"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projeto *</Label>
                  <Select value={projectId} onValueChange={setProjectId} required>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.code} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Trabalho *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva as atividades realizadas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A registar...
                    </>
                  ) : (
                    "Registar Timesheet"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-timesheets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Meus Timesheets</CardTitle>
                <CardDescription>
                  Histórico de horas registadas
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleExport} disabled={!myTimesheets || myTimesheets.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loadingMy ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !myTimesheets || myTimesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ainda não registou nenhum timesheet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTimesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>{formatDate(ts.date)}</TableCell>
                        <TableCell className="font-medium">{ts.projectCode || "N/A"}</TableCell>
                        <TableCell className="text-right">{ts.hours}h</TableCell>
                        <TableCell className="max-w-md truncate">{ts.description}</TableCell>
                        <TableCell>{getStatusBadge(ts.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "admin" && (
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aprovações Pendentes</CardTitle>
                <CardDescription>
                  Timesheets aguardando aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !pendingTimesheets || pendingTimesheets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ✓ Sem timesheets pendentes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTimesheets.map((ts) => (
                        <TableRow key={ts.id}>
                          <TableCell className="font-medium">{ts.userName}</TableCell>
                          <TableCell>{formatDate(ts.date)}</TableCell>
                          <TableCell>{ts.projectCode || "N/A"}</TableCell>
                          <TableCell className="text-right">{ts.hours}h</TableCell>
                          <TableCell className="max-w-md truncate">{ts.description}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => approveMutation.mutate({ id: ts.id })}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate({ id: ts.id })}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
