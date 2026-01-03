import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Star, TrendingUp, TrendingDown, Award, DollarSign, Package, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  const { data: suppliers, isLoading: loadingSuppliers } = trpc.suppliers.list.useQuery();
  const { data: rankings, isLoading: loadingRankings } = trpc.suppliers.getRankings.useQuery();
  const { data: topSuppliers } = trpc.suppliers.getTopSuppliers.useQuery({ criteria: "overall", limit: 5 });
  const { data: supplierKPIs } = trpc.suppliers.getKPIs.useQuery(
    { supplierId: selectedSupplier! },
    { enabled: !!selectedSupplier }
  );
  const { data: transactions } = trpc.suppliers.getTransactions.useQuery(
    { supplierId: selectedSupplier! },
    { enabled: !!selectedSupplier }
  );
  const { data: evaluations } = trpc.suppliers.getEvaluations.useQuery(
    { supplierId: selectedSupplier! },
    { enabled: !!selectedSupplier }
  );

  const utils = trpc.useUtils();
  const createEvaluation = trpc.suppliers.createEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Avaliação criada com sucesso");
      setShowEvaluationDialog(false);
      utils.suppliers.getKPIs.invalidate();
      utils.suppliers.getEvaluations.invalidate();
      utils.suppliers.getRankings.invalidate();
    },
  });

  const createTransaction = trpc.suppliers.createTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transação criada com sucesso");
      setShowTransactionDialog(false);
      utils.suppliers.getTransactions.invalidate();
      utils.suppliers.getKPIs.invalidate();
    },
  });

  const handleCreateEvaluation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const formData = new FormData(e.currentTarget);
    createEvaluation.mutate({
      supplierId: selectedSupplier,
      qualityRating: parseInt(formData.get("qualityRating") as string),
      deliveryRating: parseInt(formData.get("deliveryRating") as string),
      communicationRating: parseInt(formData.get("communicationRating") as string),
      priceRating: parseInt(formData.get("priceRating") as string),
      comments: formData.get("comments") as string,
      wouldRecommend: formData.get("wouldRecommend") === "true",
    });
  };

  const handleCreateTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const formData = new FormData(e.currentTarget);
    createTransaction.mutate({
      supplierId: selectedSupplier,
      type: formData.get("type") as "purchase" | "payment" | "refund" | "credit",
      amount: formData.get("amount") as string,
      currency: formData.get("currency") as string || "EUR",
      description: formData.get("description") as string,
      transactionDate: new Date(formData.get("transactionDate") as string),
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 #{rank}</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 #{rank}</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">🥉 #{rank}</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loadingSuppliers || loadingRankings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Carregando análise de desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Análise de desempenho e ranking</p>
        </div>
      </div>

      <Tabs defaultValue="rankings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="analytics">Análise Detalhada</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
        </TabsList>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-6">
          {/* Top Performers */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Melhor Qualidade</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                {topSuppliers && topSuppliers[0] && (
                  <>
                    <div className="text-2xl font-bold">{topSuppliers[0].supplierName}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">
                        {topSuppliers[0].averageQualityRating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Melhor Pontualidade</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {topSuppliers && topSuppliers[0] && (
                  <>
                    <div className="text-2xl font-bold">{topSuppliers[0].supplierName}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {topSuppliers[0].onTimeDeliveryRate.toFixed(0)}% no prazo
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maior Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                {topSuppliers && topSuppliers[0] && (
                  <>
                    <div className="text-2xl font-bold">{topSuppliers[0].supplierName}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      €{topSuppliers[0].totalSpent.toLocaleString()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking Geral de Fornecedores</CardTitle>
              <CardDescription>Classificação baseada em qualidade, pontualidade, preço e comunicação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings?.map((ranking) => (
                  <div
                    key={ranking.supplierId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedSupplier(ranking.supplierId)}
                  >
                    <div className="flex items-center gap-4">
                      {getRankBadge(ranking.rank)}
                      <div>
                        <div className="font-semibold">{ranking.supplierName}</div>
                        <div className="text-sm text-muted-foreground">
                          {ranking.totalOrders} encomendas • €{ranking.totalSpent.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className="text-lg font-bold">{ranking.rankScore.toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Avaliação</div>
                        <div className={`text-lg font-bold flex items-center gap-1 ${getRatingColor(ranking.overallRating)}`}>
                          <Star className="h-4 w-4 fill-current" />
                          {ranking.overallRating.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Pontualidade</div>
                        <div className="text-lg font-bold">{ranking.onTimeDeliveryRate.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {!selectedSupplier ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um fornecedor no ranking para ver análise detalhada
              </CardContent>
            </Card>
          ) : supplierKPIs ? (
            <>
              <div className="grid gap-6 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avaliação Geral</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getRatingColor(supplierKPIs.overallRating)}`}>
                      {supplierKPIs.overallRating.toFixed(1)}/5.0
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {supplierKPIs.totalEvaluations} avaliações
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pontualidade</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{supplierKPIs.onTimeDeliveryRate.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {supplierKPIs.completedOrders} de {supplierKPIs.totalOrders} no prazo
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{supplierKPIs.totalSpent.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {supplierKPIs.totalTransactions} transações
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recomendação</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{supplierKPIs.recommendationRate.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de recomendação</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada de Desempenho</CardTitle>
                  <CardDescription>{supplierKPIs.supplierName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Qualidade</span>
                        <span className={`text-sm font-bold ${getRatingColor(supplierKPIs.averageQualityRating)}`}>
                          {supplierKPIs.averageQualityRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${(supplierKPIs.averageQualityRating / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Pontualidade de Entrega</span>
                        <span className={`text-sm font-bold ${getRatingColor(supplierKPIs.averageDeliveryRating)}`}>
                          {supplierKPIs.averageDeliveryRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${(supplierKPIs.averageDeliveryRating / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Comunicação</span>
                        <span className={`text-sm font-bold ${getRatingColor(supplierKPIs.averageCommunicationRating)}`}>
                          {supplierKPIs.averageCommunicationRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${(supplierKPIs.averageCommunicationRating / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Relação Qualidade/Preço</span>
                        <span className={`text-sm font-bold ${getRatingColor(supplierKPIs.averagePriceRating)}`}>
                          {supplierKPIs.averagePriceRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-600"
                          style={{ width: `${(supplierKPIs.averagePriceRating / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-6">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Valor Médio por Transação</div>
                      <div className="text-2xl font-bold mt-1">€{supplierKPIs.averageTransactionValue.toLocaleString()}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</div>
                      <div className="text-2xl font-bold mt-1">€{supplierKPIs.pendingPayments.toLocaleString()}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Atraso Médio de Entrega</div>
                      <div className="text-2xl font-bold mt-1">
                        {supplierKPIs.averageDeliveryDelay.toFixed(1)} dias
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Encomendas Canceladas</div>
                      <div className="text-2xl font-bold mt-1">{supplierKPIs.cancelledOrders}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {!selectedSupplier ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um fornecedor para ver transações
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Histórico de Transações</CardTitle>
                    <CardDescription>
                      {suppliers?.find(s => s.id === selectedSupplier)?.name}
                    </CardDescription>
                  </div>
                  <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
                    <DialogTrigger asChild>
                      <Button>Nova Transação</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registrar Transação</DialogTitle>
                        <DialogDescription>Adicione uma nova transação com o fornecedor</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateTransaction} className="space-y-4">
                        <div>
                          <Label htmlFor="type">Tipo</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="purchase">Compra</SelectItem>
                              <SelectItem value="payment">Pagamento</SelectItem>
                              <SelectItem value="refund">Reembolso</SelectItem>
                              <SelectItem value="credit">Crédito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Valor</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="transactionDate">Data</Label>
                          <Input
                            id="transactionDate"
                            name="transactionDate"
                            type="date"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Descrição da transação"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Registrar
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{transaction.description || transaction.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.transactionDate).toLocaleDateString("pt-PT")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            €{parseFloat(transaction.amount.toString()).toLocaleString()}
                          </div>
                          <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma transação registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6">
          {!selectedSupplier ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um fornecedor para ver avaliações
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Avaliações</CardTitle>
                    <CardDescription>
                      {suppliers?.find(s => s.id === selectedSupplier)?.name}
                    </CardDescription>
                  </div>
                  <Dialog open={showEvaluationDialog} onOpenChange={setShowEvaluationDialog}>
                    <DialogTrigger asChild>
                      <Button>Nova Avaliação</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Avaliar Fornecedor</DialogTitle>
                        <DialogDescription>Avalie o desempenho do fornecedor</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateEvaluation} className="space-y-4">
                        <div>
                          <Label htmlFor="qualityRating">Qualidade (1-5)</Label>
                          <Input
                            id="qualityRating"
                            name="qualityRating"
                            type="number"
                            min="1"
                            max="5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryRating">Pontualidade (1-5)</Label>
                          <Input
                            id="deliveryRating"
                            name="deliveryRating"
                            type="number"
                            min="1"
                            max="5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="communicationRating">Comunicação (1-5)</Label>
                          <Input
                            id="communicationRating"
                            name="communicationRating"
                            type="number"
                            min="1"
                            max="5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="priceRating">Relação Qualidade/Preço (1-5)</Label>
                          <Input
                            id="priceRating"
                            name="priceRating"
                            type="number"
                            min="1"
                            max="5"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="wouldRecommend">Recomendaria?</Label>
                          <Select name="wouldRecommend" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Sim</SelectItem>
                              <SelectItem value="false">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="comments">Comentários</Label>
                          <Textarea
                            id="comments"
                            name="comments"
                            placeholder="Comentários sobre o fornecedor"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Avaliar
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluations && evaluations.length > 0 ? (
                    evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                            <span className="font-bold text-lg">{evaluation.overallRating.toFixed(1)}/5.0</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(evaluation.evaluatedAt).toLocaleDateString("pt-PT")}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Qualidade: {evaluation.qualityRating}/5</div>
                          <div>Pontualidade: {evaluation.deliveryRating}/5</div>
                          <div>Comunicação: {evaluation.communicationRating}/5</div>
                          <div>Preço: {evaluation.priceRating}/5</div>
                        </div>
                        {evaluation.comments && (
                          <p className="text-sm text-muted-foreground mt-2">{evaluation.comments}</p>
                        )}
                        {evaluation.wouldRecommend && (
                          <Badge variant="default" className="mt-2">Recomendado</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma avaliação registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
