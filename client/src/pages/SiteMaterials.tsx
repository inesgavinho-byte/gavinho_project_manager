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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, Package, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function SiteMaterials() {
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [selectedConstruction, setSelectedConstruction] = useState<number | null>(null);

  // Get constructions list
  const { data: constructions } = trpc.constructions.list.useQuery();

  // Get material requests
  const { data: materialRequests, refetch: refetchRequests } = trpc.siteManagement.materialRequests.list.useQuery(
    { constructionId: selectedConstruction! },
    { enabled: !!selectedConstruction }
  );

  // Get material usage
  const { data: materialUsage, refetch: refetchUsage } = trpc.siteManagement.materialUsage.listByConstruction.useQuery(
    { constructionId: selectedConstruction! },
    { enabled: !!selectedConstruction }
  );

  // Create material request mutation
  const createRequest = trpc.siteManagement.materialRequests.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Requisição criada",
        description: "A requisição de material foi registada com sucesso.",
      });
      setIsRequestDialogOpen(false);
      refetchRequests();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create material usage mutation
  const createUsage = trpc.siteManagement.materialUsage.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Consumo registado",
        description: "O consumo de material foi registado com sucesso.",
      });
      setIsUsageDialogOpen(false);
      refetchUsage();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve request mutation
  const approveRequest = trpc.siteManagement.materialRequests.approve.useMutation({
    onSuccess: () => {
      toast({
        title: "Requisição aprovada",
        description: "A requisição foi aprovada com sucesso.",
      });
      refetchRequests();
    },
  });

  // Reject request mutation
  const rejectRequest = trpc.siteManagement.materialRequests.reject.useMutation({
    onSuccess: () => {
      toast({
        title: "Requisição rejeitada",
        description: "A requisição foi rejeitada.",
      });
      refetchRequests();
    },
  });

  const handleRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConstruction) {
      toast({
        title: "Erro",
        description: "Selecione uma obra primeiro",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    createRequest.mutate({
      constructionId: selectedConstruction,
      materialName: formData.get("materialName") as string,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      urgency: formData.get("urgency") as "low" | "medium" | "high" | "urgent",
      reason: formData.get("reason") as string || undefined,
    });
  };

  const handleUsageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConstruction) {
      toast({
        title: "Erro",
        description: "Selecione uma obra primeiro",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    createUsage.mutate({
      constructionId: selectedConstruction,
      materialName: formData.get("materialName") as string,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      location: formData.get("location") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente", icon: AlertCircle },
      approved: { variant: "default" as const, label: "Aprovado", icon: CheckCircle },
      rejected: { variant: "destructive" as const, label: "Rejeitado", icon: XCircle },
      delivered: { variant: "outline" as const, label: "Entregue", icon: Package },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      urgent: "destructive",
    } as const;

    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };

    return (
      <Badge variant={variants[urgency as keyof typeof variants]}>
        {labels[urgency as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-light tracking-tight mb-2">
          Gestão de Materiais
        </h1>
        <p className="text-muted-foreground">
          Requisições e consumos de materiais em obra
        </p>
      </div>

      <div className="grid gap-6">
        {/* Construction Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Obra</CardTitle>
            <CardDescription>
              Escolha a obra para gerir materiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedConstruction?.toString()}
              onValueChange={(value) => setSelectedConstruction(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma obra" />
              </SelectTrigger>
              <SelectContent>
                {constructions?.map((construction) => (
                  <SelectItem key={construction.id} value={construction.id.toString()}>
                    {construction.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedConstruction && (
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">Requisições</TabsTrigger>
              <TabsTrigger value="usage">Consumos</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-6">
              {/* Actions Bar */}
              <div className="flex justify-end">
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Requisição
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nova Requisição de Material</DialogTitle>
                      <DialogDescription>
                        Solicite materiais para a obra
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialName">Material *</Label>
                        <Input
                          id="materialName"
                          name="materialName"
                          placeholder="Ex: Cimento Portland"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantidade *</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            step="0.01"
                            placeholder="100"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidade *</Label>
                          <Input
                            id="unit"
                            name="unit"
                            placeholder="kg, m³, un"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgência *</Label>
                        <Select name="urgency" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Motivo</Label>
                        <Textarea
                          id="reason"
                          name="reason"
                          placeholder="Descreva o motivo da requisição..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsRequestDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createRequest.isPending}>
                          {createRequest.isPending ? "A criar..." : "Criar Requisição"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Requests Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Requisições de Materiais</CardTitle>
                  <CardDescription>
                    {materialRequests?.length || 0} requisição(ões) registada(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!materialRequests || materialRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Nenhuma requisição encontrada
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Crie uma nova requisição para começar
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Urgência</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.materialName}
                            </TableCell>
                            <TableCell>
                              {request.quantity} {request.unit}
                            </TableCell>
                            <TableCell>
                              {getUrgencyBadge(request.urgency || "medium")}
                            </TableCell>
                            <TableCell>
                              {format(new Date(request.requestDate), "dd/MM/yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(request.status)}
                            </TableCell>
                            <TableCell>
                              {request.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveRequest.mutate({ id: request.id })}
                                    disabled={approveRequest.isPending}
                                  >
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectRequest.mutate({ id: request.id })}
                                    disabled={rejectRequest.isPending}
                                  >
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              {/* Actions Bar */}
              <div className="flex justify-end">
                <Dialog open={isUsageDialogOpen} onValueChange={setIsUsageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Registar Consumo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Registar Consumo de Material</DialogTitle>
                      <DialogDescription>
                        Registe materiais utilizados na obra
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUsageSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialName">Material *</Label>
                        <Input
                          id="materialName"
                          name="materialName"
                          placeholder="Ex: Cimento Portland"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantidade *</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            step="0.01"
                            placeholder="50"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit">Unidade *</Label>
                          <Input
                            id="unit"
                            name="unit"
                            placeholder="kg, m³, un"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="Ex: Piso 2, Sala A"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Observações sobre o consumo..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsUsageDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createUsage.isPending}>
                          {createUsage.isPending ? "A registar..." : "Registar Consumo"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Usage Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Consumos de Materiais</CardTitle>
                  <CardDescription>
                    {materialUsage?.length || 0} consumo(s) registado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!materialUsage || materialUsage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Nenhum consumo registado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Registe consumos de materiais utilizados
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialUsage.map((usage) => (
                          <TableRow key={usage.id}>
                            <TableCell className="font-medium">
                              {usage.materialName}
                            </TableCell>
                            <TableCell>
                              {usage.quantity} {usage.unit}
                            </TableCell>
                            <TableCell>
                              {usage.location || "-"}
                            </TableCell>
                            <TableCell>
                              {format(new Date(usage.date), "dd/MM/yyyy", { locale: pt })}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {usage.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
