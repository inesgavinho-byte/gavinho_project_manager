import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2, Edit2, Clock, BarChart3, Send } from "lucide-react";

export default function EmailAdminPanel() {
  const [recipients, setRecipients] = useState([
    { id: 1, email: "ines@gavinho.com", name: "Inês Gavinho", role: "Direção Criativa", active: true },
    { id: 2, email: "admin@gavinho.com", name: "Administrador", role: "Admin", active: true },
  ]);

  const [emailFrequency, setEmailFrequency] = useState({
    dailyReport: { enabled: true, time: "18:00", frequency: "daily" },
    weeklyReport: { enabled: true, day: "friday", time: "17:00", frequency: "weekly" },
    monthlyReport: { enabled: true, day: 1, time: "09:00", frequency: "monthly" },
  });

  const [emailHistory, setEmailHistory] = useState([
    {
      id: 1,
      recipient: "ines@gavinho.com",
      subject: "Relatório Diário - BIA Insights",
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "sent",
      type: "daily",
    },
    {
      id: 2,
      recipient: "admin@gavinho.com",
      subject: "Relatório Semanal - Performance",
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "sent",
      type: "weekly",
    },
    {
      id: 3,
      recipient: "ines@gavinho.com",
      subject: "Relatório Mensal - Análise Completa",
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "failed",
      type: "monthly",
    },
  ]);

  const [newRecipient, setNewRecipient] = useState({ email: "", name: "", role: "" });

  const addRecipient = () => {
    if (newRecipient.email && newRecipient.name) {
      setRecipients([
        ...recipients,
        {
          id: Math.max(...recipients.map((r) => r.id), 0) + 1,
          email: newRecipient.email,
          name: newRecipient.name,
          role: newRecipient.role || "Membro",
          active: true,
        },
      ]);
      setNewRecipient({ email: "", name: "", role: "" });
    }
  };

  const removeRecipient = (id: number) => {
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const toggleRecipient = (id: number) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel de Administração de Email</h1>
        <p className="text-muted-foreground mt-2">Gerencie destinatários, frequência e histórico de envios de relatórios</p>
      </div>

      <Tabs defaultValue="recipients" className="w-full">
        <TabsList>
          <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* TAB: DESTINATÁRIOS */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Destinatários</CardTitle>
              <CardDescription>Adicione ou remova destinatários de relatórios automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ADICIONAR NOVO DESTINATÁRIO */}
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Adicionar Novo Destinatário</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  />
                  <Input
                    placeholder="Nome"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  />
                  <Input
                    placeholder="Função"
                    value={newRecipient.role}
                    onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value })}
                  />
                </div>
                <Button onClick={addRecipient} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Destinatário
                </Button>
              </div>

              {/* LISTA DE DESTINATÁRIOS */}
              <div className="space-y-3">
                <h3 className="font-medium">Destinatários Ativos ({recipients.filter((r) => r.active).length})</h3>
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {recipient.role}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRecipient(recipient.id)}
                        className={recipient.active ? "text-green-600" : "text-gray-400"}
                      >
                        {recipient.active ? "Ativo" : "Inativo"}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeRecipient(recipient.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: FREQUÊNCIA */}
        <TabsContent value="frequency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Frequência de Envios</CardTitle>
              <CardDescription>Defina quando e com que frequência os relatórios devem ser enviados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RELATÓRIO DIÁRIO */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Relatório Diário</h3>
                      <p className="text-sm text-muted-foreground">Enviado todos os dias</p>
                    </div>
                  </div>
                  <Badge className={emailFrequency.dailyReport.enabled ? "bg-green-600" : "bg-gray-400"}>
                    {emailFrequency.dailyReport.enabled ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hora de Envio</label>
                    <Input
                      type="time"
                      value={emailFrequency.dailyReport.time}
                      onChange={(e) =>
                        setEmailFrequency({
                          ...emailFrequency,
                          dailyReport: { ...emailFrequency.dailyReport, time: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      {emailFrequency.dailyReport.enabled ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* RELATÓRIO SEMANAL */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Relatório Semanal</h3>
                      <p className="text-sm text-muted-foreground">Enviado toda sexta-feira</p>
                    </div>
                  </div>
                  <Badge className={emailFrequency.weeklyReport.enabled ? "bg-green-600" : "bg-gray-400"}>
                    {emailFrequency.weeklyReport.enabled ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hora de Envio</label>
                    <Input
                      type="time"
                      value={emailFrequency.weeklyReport.time}
                      onChange={(e) =>
                        setEmailFrequency({
                          ...emailFrequency,
                          weeklyReport: { ...emailFrequency.weeklyReport, time: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      {emailFrequency.weeklyReport.enabled ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* RELATÓRIO MENSAL */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Relatório Mensal</h3>
                      <p className="text-sm text-muted-foreground">Enviado no primeiro dia do mês</p>
                    </div>
                  </div>
                  <Badge className={emailFrequency.monthlyReport.enabled ? "bg-green-600" : "bg-gray-400"}>
                    {emailFrequency.monthlyReport.enabled ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Hora de Envio</label>
                    <Input
                      type="time"
                      value={emailFrequency.monthlyReport.time}
                      onChange={(e) =>
                        setEmailFrequency({
                          ...emailFrequency,
                          monthlyReport: { ...emailFrequency.monthlyReport, time: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      {emailFrequency.monthlyReport.enabled ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full">Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: HISTÓRICO */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Envios</CardTitle>
              <CardDescription>Visualize todos os relatórios enviados e seus status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emailHistory.map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{email.subject}</p>
                          <p className="text-sm text-muted-foreground">{email.recipient}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{email.sentAt.toLocaleDateString("pt-PT")}</p>
                        <p className="text-xs text-muted-foreground">{email.sentAt.toLocaleTimeString("pt-PT")}</p>
                      </div>
                      <Badge className={getStatusColor(email.status)}>
                        {email.status === "sent" ? "Enviado" : email.status === "failed" ? "Falha" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AÇÕES RÁPIDAS */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <Send className="w-4 h-4 mr-2" />
            Enviar Relatório Agora
          </Button>
          <Button variant="outline" className="flex-1">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visualizar Estatísticas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
