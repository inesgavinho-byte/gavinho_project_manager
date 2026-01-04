import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AtSign, 
  MessageCircle, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { MentionText } from "@/components/MentionInput";
import { useLocation } from "wouter";
import { toast } from "sonner";

type FilterType = "all" | "unread" | "read";

export default function Mentions() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [, setLocation] = useLocation();

  const { data: mentions, isLoading, refetch } = trpc.mentions.getUserMentions.useQuery({
    limit: 50,
    offset: 0,
    unreadOnly: filter === "unread",
  });

  const { data: unreadCount } = trpc.mentions.getUnreadMentionsCount.useQuery();

  const markAsReadMutation = trpc.mentions.markMentionAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Menção marcada como lida");
    },
  });

  const handleMarkAsRead = (mentionId: number) => {
    markAsReadMutation.mutate({ mentionId });
  };

  const handleNavigateToScenario = (scenarioId: number, mentionId: number) => {
    // Mark as read when navigating
    if (mentions?.find(m => m.id === mentionId && !m.isRead)) {
      markAsReadMutation.mutate({ mentionId });
    }
    setLocation(`/what-if?scenario=${scenarioId}`);
  };

  const filteredMentions = mentions?.filter(mention => {
    if (filter === "unread") return !mention.isRead;
    if (filter === "read") return mention.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AtSign className="h-8 w-8" />
            Minhas Menções
          </h1>
          <p className="text-muted-foreground mt-1">
            Veja todos os comentários onde você foi mencionado
          </p>
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Todas
            {mentions && (
              <Badge variant="secondary" className="ml-1">
                {mentions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Não lidas
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Lidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Carregando menções...</p>
              </CardContent>
            </Card>
          ) : !filteredMentions || filteredMentions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AtSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "Nenhuma menção não lida"
                    : filter === "read"
                    ? "Nenhuma menção lida"
                    : "Você ainda não foi mencionado em nenhum comentário"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMentions.map((mention: any) => (
                <Card 
                  key={mention.id} 
                  className={`hover:shadow-md transition-shadow ${
                    !mention.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10" : ""
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-full ${
                        !mention.isRead 
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        <AtSign className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <p className="text-sm mb-1">
                              <span className="font-semibold">
                                {mention.mentionedByUser?.name || "Usuário"}
                              </span>
                              {" "}
                              <span className="text-muted-foreground">
                                mencionou você em um comentário
                              </span>
                            </p>

                            {/* Comment preview */}
                            {mention.comment?.comment && (
                              <div className="bg-muted/50 rounded-lg p-3 mt-2 border border-border">
                                <div className="flex items-start gap-2">
                                  <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <div className="text-sm flex-1">
                                    <MentionText text={mention.comment.comment} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(mention.createdAt), {
                                addSuffix: true,
                                locale: pt,
                              })}
                            </p>
                          </div>

                          {/* Status Badge */}
                          {!mention.isRead && (
                            <Badge variant="default" className="shrink-0">
                              Nova
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleNavigateToScenario(mention.scenarioId, mention.id)}
                            className="h-8"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver cenário
                          </Button>
                          
                          {!mention.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(mention.id)}
                              disabled={markAsReadMutation.isPending}
                              className="h-8"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
