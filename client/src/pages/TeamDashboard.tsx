import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Target, Clock } from "lucide-react";

export default function TeamDashboard() {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Inês Gavinho",
      email: "ines@gavinho.com",
      role: "Direção Criativa",
      projectsAssigned: 5,
      tasksCompleted: 42,
      performanceScore: 95,
      lastActive: new Date(),
      status: "active",
    },
    {
      id: 2,
      name: "João Silva",
      email: "joao@gavinho.com",
      role: "Arquiteto",
      projectsAssigned: 3,
      tasksCompleted: 28,
      performanceScore: 88,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "active",
    },
    {
      id: 3,
      name: "Maria Santos",
      email: "maria@gavinho.com",
      role: "Designer",
      projectsAssigned: 4,
      tasksCompleted: 35,
      performanceScore: 92,
      lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: "active",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "on-leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    return "text-orange-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Equipa</h1>
        <p className="text-muted-foreground mt-2">Visualize o desempenho e atividade da equipa</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Membros Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Todos os membros online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.reduce((sum, m) => sum + m.tasksCompleted, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Performance Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(teamMembers.reduce((sum, m) => sum + m.performanceScore, 0) / teamMembers.length)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Equipa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.reduce((sum, m) => sum + m.projectsAssigned, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total atribuído</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipa</CardTitle>
              <CardDescription>Visualize informações de cada membro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.projectsAssigned} Projetos</p>
                        <p className="text-xs text-muted-foreground">{member.tasksCompleted} Tarefas</p>
                      </div>
                      <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Individual</CardTitle>
              <CardDescription>Pontuação de desempenho por membro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamMembers.map((member) => (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{member.name}</p>
                      <span className={`text-lg font-bold ${getPerformanceColor(member.performanceScore)}`}>
                        {member.performanceScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${member.performanceScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Última atividade: {member.lastActive.toLocaleTimeString("pt-PT")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
