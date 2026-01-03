import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageCircle, 
  Share2, 
  Star, 
  FileEdit, 
  FilePlus, 
  Trash2,
  Filter,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { MentionText } from "@/components/MentionInput";

type ActivityType =
  | "scenario_created"
  | "scenario_updated"
  | "scenario_shared"
  | "scenario_commented"
  | "scenario_favorited"
  | "scenario_deleted";

const activityIcons: Record<ActivityType, any> = {
  scenario_created: FilePlus,
  scenario_updated: FileEdit,
  scenario_shared: Share2,
  scenario_commented: MessageCircle,
  scenario_favorited: Star,
  scenario_deleted: Trash2,
};

const activityLabels: Record<ActivityType, string> = {
  scenario_created: "criou o cenário",
  scenario_updated: "atualizou o cenário",
  scenario_shared: "compartilhou o cenário",
  scenario_commented: "comentou no cenário",
  scenario_favorited: "favoritou o cenário",
  scenario_deleted: "excluiu o cenário",
};

const activityColors: Record<ActivityType, string> = {
  scenario_created: "text-green-600 bg-green-50",
  scenario_updated: "text-blue-600 bg-blue-50",
  scenario_shared: "text-purple-600 bg-purple-50",
  scenario_commented: "text-orange-600 bg-orange-50",
  scenario_favorited: "text-yellow-600 bg-yellow-50",
  scenario_deleted: "text-red-600 bg-red-50",
};

export default function ActivityFeed() {
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | "all">("all");

  const { data: activities, isLoading, refetch } = trpc.activityFeed.getActivities.useQuery({
    limit: 50,
    offset: 0,
    activityTypes: selectedFilter === "all" ? undefined : [selectedFilter],
  });

  const { data: unreadCount } = trpc.activityFeed.getUnreadCount.useQuery({});

  const markAsReadMutation = trpc.activityFeed.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate({ beforeDate: new Date() });
  };

  const getActivityIcon = (type: ActivityType) => {
    const Icon = activityIcons[type];
    return Icon ? <Icon className="h-4 w-4" /> : <Bell className="h-4 w-4" />;
  };

  const filterOptions: { value: ActivityType | "all"; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "scenario_created", label: "Criações" },
    { value: "scenario_updated", label: "Atualizações" },
    { value: "scenario_shared", label: "Compartilhamentos" },
    { value: "scenario_commented", label: "Comentários" },
    { value: "scenario_favorited", label: "Favoritos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feed de Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as atualizações e interações nos cenários compartilhados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carregando atividades...</p>
          </CardContent>
        </Card>
      ) : !activities || activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedFilter === "all"
                ? "Nenhuma atividade recente"
                : "Nenhuma atividade deste tipo"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity: any) => {
            const Icon = activityIcons[activity.activityType as ActivityType];
            const colorClass = activityColors[activity.activityType as ActivityType];
            const label = activityLabels[activity.activityType as ActivityType];
            const metadata = activity.metadata || {};

            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{activity.actorName || "Usuário"}</span>
                            {" "}
                            <span className="text-muted-foreground">{label}</span>
                            {metadata.scenarioName && (
                              <span className="font-medium ml-1">"{metadata.scenarioName}"</span>
                            )}
                          </p>

                          {/* Metadata */}
                          {metadata.comment && (
                            <div className="text-sm text-muted-foreground mt-1 italic">
                              "<MentionText text={metadata.comment} />"
                            </div>
                          )}

                          {/* Mention Badge */}
                          {metadata.isMention && (
                            <Badge variant="secondary" className="mt-2">
                              <span className="text-xs">Você foi mencionado</span>
                            </Badge>
                          )}

                          {/* Reply Badge */}
                          {metadata.isReply && (
                            <Badge variant="secondary" className="mt-2">
                              <span className="text-xs">Resposta ao seu comentário</span>
                            </Badge>
                          )}

                          {metadata.sharedWith && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Compartilhado com: {metadata.sharedWith}
                            </p>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: pt,
                            })}
                          </p>
                        </div>

                        {/* Badge */}
                        <Badge variant="outline" className="shrink-0">
                          {activity.activityType.replace("scenario_", "").replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
