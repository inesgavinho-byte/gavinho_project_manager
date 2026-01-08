import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Search, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

export default function Purchases() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock purchases data
  const purchases = [
    { id: 1, code: "PO-2024-001", supplier: "Materiais Silva", items: "Cimento, Areia", value: 2500, status: "delivered", date: "2024-01-10", project: "MYRIAD" },
    { id: 2, code: "PO-2024-002", supplier: "Tintas Premium", items: "Tinta branca, Primário", value: 1200, status: "in_transit", date: "2024-01-12", project: "AS HOUSE" },
    { id: 3, code: "PO-2024-003", supplier: "Ferragens Costa", items: "Parafusos, Dobradiças", value: 450, status: "ordered", date: "2024-01-15", project: "PENTHOUSE" },
    { id: 4, code: "PO-2024-004", supplier: "Madeiras Nobre", items: "Tábuas de carvalho", value: 3800, status: "pending", date: "2024-01-16", project: "MYRIAD" },
  ];

  const filteredPurchases = purchases.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.items.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = purchases.reduce((sum, p) => sum + p.value, 0);
  const deliveredCount = purchases.filter(p => p.status === 'delivered').length;
  const pendingCount = purchases.filter(p => p.status === 'pending').length;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Gestão de encomendas e fornecedores
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Encomenda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Encomendas</p>
              <p className="text-3xl font-bold">{purchases.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-3xl font-bold">€{totalValue.toLocaleString('pt-PT')}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entregues</p>
              <p className="text-3xl font-bold">{deliveredCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar encomendas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Purchases List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Encomendas Recentes</h3>
        <div className="space-y-3">
          {filteredPurchases.map(purchase => (
            <div key={purchase.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  purchase.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/20' :
                  purchase.status === 'in_transit' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  purchase.status === 'ordered' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-gray-100 dark:bg-gray-900/20'
                }`}>
                  {purchase.status === 'delivered' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : purchase.status === 'in_transit' ? (
                    <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  ) : purchase.status === 'ordered' ? (
                    <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{purchase.code}</p>
                  <p className="text-sm text-muted-foreground">{purchase.supplier}</p>
                  <p className="text-xs text-muted-foreground">{purchase.items}</p>
                  {purchase.project && (
                    <p className="text-xs text-muted-foreground">Projeto: {purchase.project}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold">€{purchase.value.toLocaleString('pt-PT')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(purchase.date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <Badge variant={
                  purchase.status === 'delivered' ? 'default' :
                  purchase.status === 'in_transit' ? 'secondary' :
                  purchase.status === 'ordered' ? 'outline' :
                  'secondary'
                }>
                  {purchase.status === 'delivered' ? 'Entregue' :
                   purchase.status === 'in_transit' ? 'Em Trânsito' :
                   purchase.status === 'ordered' ? 'Encomendado' :
                   'Pendente'}
                </Badge>
                <Button variant="outline" size="sm">Ver Detalhes</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
