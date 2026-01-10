import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, FileText, Clock, Activity } from "lucide-react";

interface UserStatsProps {
  stats: {
    projectsCreated: number;
    projectsAsMember: number;
    totalProjects: number;
    totalHours: number;
    recentActivitiesCount: number;
  } | null | undefined;
  loading?: boolean;
}

export function UserStats({ stats, loading }: UserStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Estatísticas não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Projetos Criados",
      value: stats.projectsCreated,
      icon: Briefcase,
      color: "from-sand to-blush",
    },
    {
      title: "Projetos (Membro)",
      value: stats.projectsAsMember,
      icon: FileText,
      color: "from-blue-200 to-blue-100",
    },
    {
      title: "Total de Projetos",
      value: stats.totalProjects,
      icon: Activity,
      color: "from-green-200 to-green-100",
    },
    {
      title: "Horas Registadas",
      value: stats.totalHours.toFixed(1),
      icon: Clock,
      color: "from-purple-200 to-purple-100",
    },
    {
      title: "Atividades Recentes",
      value: stats.recentActivitiesCount,
      icon: Activity,
      color: "from-orange-200 to-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-border/40 overflow-hidden">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-brown opacity-70" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-brown mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
