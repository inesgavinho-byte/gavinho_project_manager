import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, Filter, CheckCircle2, Clock, Package, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Emails() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: emails = [], isLoading, refetch } = trpc.emails.list.useQuery();
  const { data: stats = [] } = trpc.emails.stats.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  
  const assignToProjectMutation = trpc.emails.assignToProject.useMutation({
    onSuccess: () => {
      toast.success("E-mail atribuído ao projeto com sucesso");
      refetch();
    },
  });

  const markAsProcessedMutation = trpc.emails.markAsProcessed.useMutation({
    onSuccess: () => {
      toast.success("E-mail marcado como processado");
      refetch();
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order":
        return <Package className="h-4 w-4" />;
      case "adjudication":
        return <FileText className="h-4 w-4" />;
      case "purchase":
        return <CheckCircle2 className="h-4 w-4" />;
      case "communication":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      order: "Encomenda",
      adjudication: "Adjudicação",
      purchase: "Compra",
      communication: "Comunicação",
      other: "Outro",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      order: "bg-blue-500/10 text-blue-700 border-blue-200",
      adjudication: "bg-purple-500/10 text-purple-700 border-purple-200",
      purchase: "bg-green-500/10 text-green-700 border-green-200",
      communication: "bg-orange-500/10 text-orange-700 border-orange-200",
      other: "bg-gray-500/10 text-gray-700 border-gray-200",
    };
    return colors[category] || colors.other;
  };

  const filteredEmails = emails.filter((email: any) => {
    if (selectedCategory !== "all" && email.category !== selectedCategory) {
      return false;
    }
    if (searchKeyword && !email.subject?.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    return true;
  });

  const statsData = stats.map((stat: any) => ({
    category: stat.category,
    count: parseInt(stat.count),
    label: getCategoryLabel(stat.category),
    color: getCategoryColor(stat.category),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">E-mails do Outlook</h1>
        <p className="text-gray-600 mt-1">
          Visualize e gerencie e-mails sincronizados e categorizados automaticamente
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {statsData.map((stat) => (
          <Card key={stat.category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              {getCategoryIcon(stat.category)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar e-mails por assunto..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="order">Encomendas</SelectItem>
            <SelectItem value="adjudication">Adjudicações</SelectItem>
            <SelectItem value="purchase">Compras</SelectItem>
            <SelectItem value="communication">Comunicações</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Email List Column */}
        <div className="lg:col-span-1 space-y-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">E-mails ({filteredEmails.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Carregando...</div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum e-mail encontrado</p>
                  </div>
                ) : (
                  filteredEmails.map((email: any) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEmail?.id === email.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{email.fromName || email.fromEmail}</p>
                          <p className="text-xs text-gray-500">{email.fromEmail}</p>
                        </div>
                        <Badge className={`${getCategoryColor(email.category)} text-xs`}>
                          {getCategoryLabel(email.category)}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-1 truncate">{email.subject}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{email.bodyPreview}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {format(new Date(email.receivedDateTime), "dd/MM/yyyy HH:mm")}
                        </span>
                        {email.isProcessed && (
                          <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Detail Column */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{selectedEmail.subject}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>De:</strong> {selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;
                      </p>
                      {selectedEmail.toEmails && (
                        <p>
                          <strong>Para:</strong> {selectedEmail.toEmails}
                        </p>
                      )}
                      <p>
                        <strong>Data:</strong> {format(new Date(selectedEmail.receivedDateTime), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getCategoryColor(selectedEmail.category)}`}>
                    {getCategoryLabel(selectedEmail.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Conteúdo</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedEmail.bodyPreview || "Sem conteúdo disponível"}
                  </div>
                </div>

                {selectedEmail.classificationReasoning && (
                  <div>
                    <h3 className="font-semibold mb-2">Análise de Classificação</h3>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm">
                      <p className="text-gray-700">{selectedEmail.classificationReasoning}</p>
                      {selectedEmail.classificationConfidence && (
                        <p className="text-xs text-gray-500 mt-2">
                          Confiança: {(parseFloat(selectedEmail.classificationConfidence) * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedEmail.suggestedActions && (
                  <div>
                    <h3 className="font-semibold mb-2">Ações Sugeridas</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                      <p className="text-gray-700">{selectedEmail.suggestedActions}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Select
                    value={selectedEmail.projectId?.toString() || ""}
                    onValueChange={(value) => {
                      if (value) {
                        assignToProjectMutation.mutate({
                          emailId: selectedEmail.id,
                          projectId: parseInt(value),
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Atribuir a projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!selectedEmail.isProcessed && (
                    <Button
                      onClick={() => markAsProcessedMutation.mutate({ emailId: selectedEmail.id })}
                      variant="outline"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Processado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Selecione um e-mail para visualizar os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Integração Outlook</CardTitle>
          <CardDescription>
            Configure a integração com Microsoft Outlook para sincronizar e categorizar automaticamente seus e-mails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium">Integração Pendente</p>
              <p className="text-sm text-gray-600">
                Configure as credenciais do Microsoft Graph API para ativar a sincronização automática
              </p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
