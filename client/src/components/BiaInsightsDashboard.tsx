import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Users } from "lucide-react";

interface TeamSentimentAnalysis {
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  positiveMessages: number;
  neutralMessages: number;
  negativeMessages: number;
  trendDirection: "improving" | "stable" | "declining";
}

interface BlockerTrend {
  category: string;
  count: number;
  severity: "low" | "medium" | "high" | "critical";
  affectedProjects: string[];
  lastOccurrence: Date;
}

interface ProjectRecommendation {
  projectId: string;
  projectName: string;
  recommendation: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedImpact: string;
  suggestedAction: string;
}

interface BiaInsights {
  teamSentiment: TeamSentimentAnalysis;
  topBlockers: BlockerTrend[];
  projectRecommendations: ProjectRecommendation[];
  teamActivity: {
    activeMembers: number;
    inactiveMembers: number;
    averageMessagesPerDay: number;
  };
  weeklyTrend: Array<{
    date: string;
    sentimentScore: number;
    messageCount: number;
    blockerCount: number;
  }>;
}

export default function BiaInsightsDashboard() {
  const [insights, setInsights] = useState<BiaInsights | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Simular carregamento de insights
    setLoading(true);
    setTimeout(() => {
      setInsights({
        teamSentiment: {
          overallSentiment: "positive",
          sentimentScore: 0.65,
          positiveMessages: 85,
          neutralMessages: 45,
          negativeMessages: 20,
          trendDirection: "improving",
        },
        topBlockers: [
          {
            category: "Aprovações de Cliente",
            count: 5,
            severity: "high",
            affectedProjects: ["GA00489", "GA00492"],
            lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            category: "Fornecedores",
            count: 3,
            severity: "medium",
            affectedProjects: ["GA00491"],
            lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
        projectRecommendations: [
          {
            projectId: "GA00489",
            projectName: "AS HOUSE",
            recommendation: "Atrasos em aprovações de cliente - considerar reunião de alinhamento",
            priority: "high",
            estimatedImpact: "Reduzir atrasos em 1-2 semanas",
            suggestedAction: "Agendar reunião com cliente para clarificar requisitos pendentes",
          },
          {
            projectId: "GA00492",
            projectName: "CASTILHO 3",
            recommendation: "Equipa está com carga de trabalho elevada - distribuir tarefas",
            priority: "medium",
            estimatedImpact: "Melhorar qualidade e reduzir stress da equipa",
            suggestedAction: "Revisar distribuição de tarefas e considerar suporte adicional",
          },
        ],
        teamActivity: {
          activeMembers: 8,
          inactiveMembers: 2,
          averageMessagesPerDay: 45,
        },
        weeklyTrend: [
          { date: "Seg", sentimentScore: 0.5, messageCount: 42, blockerCount: 2 },
          { date: "Ter", sentimentScore: 0.55, messageCount: 48, blockerCount: 1 },
          { date: "Qua", sentimentScore: 0.6, messageCount: 51, blockerCount: 2 },
          { date: "Qui", sentimentScore: 0.65, messageCount: 45, blockerCount: 1 },
          { date: "Sex", sentimentScore: 0.7, messageCount: 52, blockerCount: 0 },
          { date: "Sab", sentimentScore: 0.68, messageCount: 28, blockerCount: 1 },
          { date: "Dom", sentimentScore: 0.65, messageCount: 15, blockerCount: 0 },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Carregando insights BIA...</div>;
  }

  if (!insights) {
    return <div className="p-6 text-center">Nenhum insight disponível</div>;
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Insights BIA</h1>
          <p className="text-gray-600 mt-1">Análise de sentimento, bloqueios e recomendações</p>
        </div>
        <Button variant="outline">Atualizar Dados</Button>
      </div>

      {/* Sentimento da Equipa */}
      <Card className={`border-2 ${getSentimentColor(insights.teamSentiment.overallSentiment)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sentimento da Equipa
          </CardTitle>
          <CardDescription>Análise agregada de mensagens e atividade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{insights.teamSentiment.positiveMessages}</div>
              <div className="text-sm text-gray-600">Positivas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{insights.teamSentiment.neutralMessages}</div>
              <div className="text-sm text-gray-600">Neutras</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{insights.teamSentiment.negativeMessages}</div>
              <div className="text-sm text-gray-600">Negativas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{(insights.teamSentiment.sentimentScore * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={insights.teamSentiment.overallSentiment === "positive" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
              {insights.teamSentiment.overallSentiment.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              {insights.teamSentiment.trendDirection === "improving" ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Melhorando</span>
                </>
              ) : insights.teamSentiment.trendDirection === "declining" ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Piorando</span>
                </>
              ) : (
                <span className="text-gray-600">Estável</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloqueios Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Bloqueios Principais
          </CardTitle>
          <CardDescription>Obstáculos identificados que impactam projetos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.topBlockers.map((blocker, idx) => (
            <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <div className="font-semibold">{blocker.category}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {blocker.count} ocorrência{blocker.count > 1 ? "s" : ""} • Projetos: {blocker.affectedProjects.join(", ")}
                </div>
              </div>
              <Badge className={getSeverityColor(blocker.severity)}>{blocker.severity.toUpperCase()}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recomendações por Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recomendações por Projeto
          </CardTitle>
          <CardDescription>Ações sugeridas pela BIA para otimizar projetos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.projectRecommendations.map((rec, idx) => (
            <Alert key={idx} className="border-l-4 border-l-blue-500">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{rec.projectName}</div>
                    <Badge className={getPriorityColor(rec.priority)}>{rec.priority.toUpperCase()}</Badge>
                  </div>
                  <div className="text-sm">{rec.recommendation}</div>
                  <div className="text-sm text-gray-600">
                    <strong>Impacto:</strong> {rec.estimatedImpact}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Ação:</strong> {rec.suggestedAction}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2">
                    Aprovar Sugestão
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Atividade da Equipa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Atividade da Equipa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{insights.teamActivity.activeMembers}</div>
              <div className="text-sm text-gray-600">Membros Ativos</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{insights.teamActivity.inactiveMembers}</div>
              <div className="text-sm text-gray-600">Membros Inativos</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{insights.teamActivity.averageMessagesPerDay}</div>
              <div className="text-sm text-gray-600">Mensagens/Dia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tendência Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência Semanal</CardTitle>
          <CardDescription>Evolução de sentimento e atividade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.weeklyTrend.map((day, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 text-sm font-semibold text-gray-600">{day.date}</div>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg"
                    style={{ width: `${(day.sentimentScore / 1) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">{day.messageCount} msgs</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
