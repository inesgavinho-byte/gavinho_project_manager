import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Receipt } from "lucide-react";
import { toast } from "sonner";

interface BudgetManagementProps {
  projectId: number;
}

export function BudgetManagement({ projectId }: BudgetManagementProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);

  const { data: budgets, isLoading, refetch } = trpc.budgets.list.useQuery({ projectId });
  const { data: unreadAlerts } = trpc.budgets.alerts.listUnread.useQuery({ projectId });

  const createBudget = trpc.budgets.create.useMutation({
    onSuccess: () => {
      toast.success("Orçamento criado com sucesso!");
      setCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
    },
  });

  const createExpense = trpc.budgets.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa registrada com sucesso!");
      setExpenseDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar despesa: ${error.message}`);
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBudget.mutate({
      projectId,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      budgetedAmount: parseFloat(formData.get("budgetedAmount") as string),
      status: "draft",
    });
  };

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createExpense.mutate({
      projectId,
      budgetId: selectedBudget || undefined,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      expenseDate: formData.get("expenseDate") as string,
      supplier: formData.get("supplier") as string,
      invoiceNumber: formData.get("invoiceNumber") as string,
      paymentStatus: "pending",
    });
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "approved": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Rascunho";
      case "approved": return "Aprovado";
      case "active": return "Ativo";
      case "closed": return "Fechado";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Orçamentos</h2>
          <p className="text-muted-foreground">
            {budgets?.length || 0} orçamentos • {unreadAlerts?.length || 0} alertas pendentes
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Registrar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Despesa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova despesa ao projeto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <Label htmlFor="expense-name">Nome da Despesa *</Label>
                  <Input id="expense-name" name="name" required placeholder="Ex: Material de Construção" />
                </div>
                <div>
                  <Label htmlFor="expense-amount">Valor *</Label>
                  <Input id="expense-amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="expense-date">Data da Despesa *</Label>
                  <Input id="expense-date" name="expenseDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="expense-budget">Orçamento (opcional)</Label>
                  <Select value={selectedBudget?.toString() || ""} onValueChange={(v) => setSelectedBudget(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um orçamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem orçamento</SelectItem>
                      {budgets?.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id.toString()}>
                          {budget.name} - {budget.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expense-supplier">Fornecedor</Label>
                  <Input id="expense-supplier" name="supplier" placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <Label htmlFor="expense-invoice">Número da Fatura</Label>
                  <Input id="expense-invoice" name="invoiceNumber" placeholder="FT 2024/001" />
                </div>
                <div>
                  <Label htmlFor="expense-description">Descrição</Label>
                  <Textarea id="expense-description" name="description" rows={3} placeholder="Detalhes da despesa..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending ? "A registrar..." : "Registrar Despesa"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Orçamento</DialogTitle>
                <DialogDescription>
                  Defina um orçamento para controlar custos do projeto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <Label htmlFor="budget-name">Nome do Orçamento *</Label>
                  <Input id="budget-name" name="name" required placeholder="Ex: Materiais Q1 2024" />
                </div>
                <div>
                  <Label htmlFor="budget-category">Categoria *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Materiais">Materiais</SelectItem>
                      <SelectItem value="Mão de Obra">Mão de Obra</SelectItem>
                      <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="Subempreitadas">Subempreitadas</SelectItem>
                      <SelectItem value="Transportes">Transportes</SelectItem>
                      <SelectItem value="Licenças">Licenças e Taxas</SelectItem>
                      <SelectItem value="Consultoria">Consultoria</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget-amount">Valor Orçamentado *</Label>
                  <Input id="budget-amount" name="budgetedAmount" type="number" step="0.01" required placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="budget-description">Descrição</Label>
                  <Textarea id="budget-description" name="description" rows={3} placeholder="Detalhes do orçamento..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createBudget.isPending}>
                    {createBudget.isPending ? "A criar..." : "Criar Orçamento"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts Section */}
      {unreadAlerts && unreadAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unreadAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm text-orange-800">
                  <div className="flex-1">{alert.message}</div>
                  <span className="text-xs text-orange-600">
                    {new Date(alert.createdAt).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {budgets && budgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const budgetedAmount = parseFloat(budget.budgetedAmount);
            const actualAmount = parseFloat(budget.actualAmount);
            const variance = parseFloat(budget.variance);
            const variancePercent = parseFloat(budget.variancePercent || "0");
            const percentUsed = budgetedAmount > 0 ? (actualAmount / budgetedAmount) * 100 : 0;

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription>{budget.category}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                      {getStatusLabel(budget.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget vs Actual */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Orçamentado</span>
                      <span className="font-medium">{formatCurrency(budgetedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gasto</span>
                      <span className="font-medium">{formatCurrency(actualAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Restante</span>
                      <span className={variance < 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(budgetedAmount - actualAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Utilização</span>
                      <span>{percentUsed.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentUsed >= 100 ? "bg-red-500" :
                          percentUsed >= 90 ? "bg-orange-500" :
                          percentUsed >= 80 ? "bg-yellow-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Variance Indicator */}
                  {variance !== 0 && (
                    <div className={`flex items-center gap-2 text-sm ${variance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {variance > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {variance > 0 ? "+" : ""}{formatCurrency(Math.abs(variance))} ({variancePercent > 0 ? "+" : ""}{variancePercent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando um orçamento para controlar os custos do projeto
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
