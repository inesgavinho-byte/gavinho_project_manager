import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  Share2,
  Edit,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ActivityTimelineProps {
  userId: number;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case "comment_added":
      return <MessageSquare className="h-4 w-4" />;
    case "document_uploaded":
      return <FileText className="h-4 w-4" />;
    case "shared":
      return <Share2 className="h-4 w-4" />;
    case "edited":
      return <Edit className="h-4 w-4" />;
    case "created":
      return <Plus className="h-4 w-4" />;
    case "deleted":
      return <Trash2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (actionType: string) => {
  switch (actionType) {
    case "comment_added":
      return "bg-blue-100 text-blue-800";
    case "document_uploaded":
      return "bg-green-100 text-green-800";
    case "shared":
      return "bg-purple-100 text-purple-800";
    case "edited":
      return "bg-orange-100 text-orange-800";
    case "created":
      return "bg-sand/20 text-sand";
    case "deleted":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getActivityLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    comment_added: "Comentário Adicionado",
    document_uploaded: "Documento Carregado",
    shared: "Partilhado",
    edited: "Editado",
    created: "Criado",
    deleted: "Eliminado",
    profile_updated: "Perfil Atualizado",
    profile_picture_updated: "Foto de Perfil Atualizada",
    password_changed: "Password Alterada",
    preferences_updated: "Preferências Atualizadas",
  };
  return labels[actionType] || actionType;
};

export function ActivityTimeline({ userId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = trpc.userProfile.getMyActivities.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="border-border/40">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhuma atividade registada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Card key={activity.id} className="border-border/40 relative">
          {/* Timeline line */}
          {index !== activities.length - 1 && (
            <div className="absolute left-8 top-16 w-0.5 h-12 bg-gradient-to-b from-sand/40 to-transparent" />
          )}

          <CardContent className="pt-6">
            <div className="flex gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.actionType)} relative z-10`}>
                {getActivityIcon(activity.actionType)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {activity.description || getActivityLabel(activity.actionType)}
                    </p>
                    {activity.metadata && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeof activity.metadata === "object" &&
                          Object.entries(activity.metadata as Record<string, any>)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" • ")}
                      </p>
                    )}
                  </div>

                  <Badge variant="secondary" className="flex-shrink-0">
                    {getActivityLabel(activity.actionType)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                      locale: pt,
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {format(new Date(activity.createdAt), "d MMM yyyy 'às' HH:mm", {
                      locale: pt,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
