'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Copy, Play, Settings, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

interface Rule {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
  createdAt: Date;
}

export function AnomalyRuleControlPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<'all' | 'threshold' | 'deviation' | 'pattern' | 'custom'>('all');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testValue, setTestValue] = useState<number | null>(null);

  const { data: rulesData, isLoading: rulesLoading } = trpc.anomalyRuleConfig.getAllRules.query();
  const { data: statsData } = trpc.anomalyRuleConfig.getRuleStatistics.query();
  const { data: templatesData } = trpc.anomalyRuleConfig.getTemplates.query({});

  const createRuleMutation = trpc.anomalyRuleConfig.createRule.useMutation();
  const updateRuleMutation = trpc.anomalyRuleConfig.updateRule.useMutation();
  const deleteRuleMutation = trpc.anomalyRuleConfig.deleteRule.useMutation();
  const toggleRuleMutation = trpc.anomalyRuleConfig.toggleRule.useMutation();
  const testRuleMutation = trpc.anomalyRuleConfig.testRule.useMutation();

  const rules = useMemo(() => {
    if (!rulesData?.rules) return [];

    return rulesData.rules.filter((rule) => {
      const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'all' || rule.severity === filterSeverity;
      const matchesType = filterType === 'all' || rule.ruleType === filterType;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [rulesData?.rules, searchTerm, filterSeverity, filterType]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await toggleRuleMutation.mutateAsync({
        ruleId,
        enabled: !enabled,
      });
    } catch (error) {
      console.error('Erro ao alternar regra:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta regra?')) {
      try {
        await deleteRuleMutation.mutateAsync({ ruleId });
      } catch (error) {
        console.error('Erro ao deletar regra:', error);
      }
    }
  };

  const handleTestRule = async (rule: Rule) => {
    if (testValue === null) {
      alert('Por favor, insira um valor de teste');
      return;
    }

    try {
      const result = await testRuleMutation.mutateAsync({
        rule: {
          name: rule.name,
          description: rule.description,
          ruleType: rule.ruleType as any,
          metric: rule.metric,
          operator: rule.operator as any,
          threshold: rule.threshold,
          severity: rule.severity,
          enabled: rule.enabled,
          notifyManagers: true,
          suggestedAction: '',
        },
        testValue,
      });

      alert(`Teste concluído: ${result.reason}`);
    } catch (error) {
      console.error('Erro ao testar regra:', error);
    }
  };

  if (rulesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando regras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Regras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statsData?.totalRules || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Configuradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statsData?.activeRules || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Em funcionamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statsData?.rulesBySeverity?.high || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Alta severidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Desativadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{statsData?.disabledRules || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Inativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Pesquisar regras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />

        <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {templatesData?.templates?.map((template: any) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setShowTemplatesDialog(false);
                  }}
                >
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showNewRuleDialog} onOpenChange={setShowNewRuleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Regra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome da regra" />
              <Input placeholder="Descrição" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de regra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">Limite</SelectItem>
                  <SelectItem value="deviation">Desvio</SelectItem>
                  <SelectItem value="pattern">Padrão</SelectItem>
                  <SelectItem value="custom">Customizada</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">Criar Regra</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Select value={filterSeverity} onValueChange={(value: any) => setFilterSeverity(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Severidades</SelectItem>
            <SelectItem value="high">Críticas</SelectItem>
            <SelectItem value="medium">Médias</SelectItem>
            <SelectItem value="low">Baixas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="threshold">Limite</SelectItem>
            <SelectItem value="deviation">Desvio</SelectItem>
            <SelectItem value="pattern">Padrão</SelectItem>
            <SelectItem value="custom">Customizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Regras */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma regra encontrada</p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    >
                      {rule.enabled ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                    >
                      <ChevronDown className={`h-4 w-4 transition ${expandedRuleId === rule.id ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedRuleId === rule.id && (
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tipo</p>
                      <p className="font-semibold">{rule.ruleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Métrica</p>
                      <p className="font-semibold">{rule.metric}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Operador</p>
                      <p className="font-semibold">{rule.operator}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Limite</p>
                      <p className="font-semibold">{rule.threshold}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold mb-2 block">Testar Regra</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Valor de teste"
                        value={testValue || ''}
                        onChange={(e) => setTestValue(e.target.value ? Number(e.target.value) : null)}
                      />
                      <Button onClick={() => handleTestRule(rule)} size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
