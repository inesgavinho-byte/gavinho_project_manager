import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Euro, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function ProposalsContracts() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock proposals data
  const proposals = [
    { id: 1, code: "PROP-2024-001", client: "Maria Residences", value: 450000, status: "draft", date: "2024-01-10", project: "MYRIAD" },
    { id: 2, code: "PROP-2024-002", client: "Hotel Comporta", value: 1200000, status: "sent", date: "2024-01-08", project: "AS HOUSE" },
    { id: 3, code: "PROP-2024-003", client: "Villa Cascais", value: 680000, status: "accepted", date: "2024-01-05", project: "PENTHOUSE" },
    { id: 4, code: "PROP-2024-004", client: "Apartamento Lisboa", value: 320000, status: "rejected", date: "2024-01-03", project: null },
  ];

  const filteredProposals = proposals.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = proposals.reduce((sum, p) => sum + p.value, 0);
  const acceptedValue = proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + p.value, 0);
  const conversionRate = ((proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100).toFixed(0);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propostas & Contratos</h1>
          <p className="text-muted-foreground">
            Gestão de propostas comerciais e contratos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Propostas</p>
              <p className="text-3xl font-bold">{proposals.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-3xl font-bold">€{(totalValue / 1000).toFixed(0)}k</p>
            </div>
            <Euro className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aceites</p>
              <p className="text-3xl font-bold">€{(acceptedValue / 1000).toFixed(0)}k</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa Conversão</p>
              <p className="text-3xl font-bold">{conversionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar propostas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Proposals List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Propostas Recentes</h3>
        <div className="space-y-3">
          {filteredProposals.map(proposal => (
            <div key={proposal.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">{proposal.code}</p>
                  <p className="text-sm text-muted-foreground">{proposal.client}</p>
                  {proposal.project && (
                    <p className="text-xs text-muted-foreground">Projeto: {proposal.project}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-semibold text-lg">€{proposal.value.toLocaleString('pt-PT')}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(proposal.date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <Badge variant={
                  proposal.status === 'accepted' ? 'default' :
                  proposal.status === 'sent' ? 'secondary' :
                  proposal.status === 'draft' ? 'outline' :
                  'destructive'
                }>
                  {proposal.status === 'accepted' ? 'Aceite' :
                   proposal.status === 'sent' ? 'Enviada' :
                   proposal.status === 'draft' ? 'Rascunho' :
                   'Rejeitada'}
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
