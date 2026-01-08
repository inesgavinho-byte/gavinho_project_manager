import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  Send,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaterialCommentsDialogProps {
  materialId: number;
  materialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialCommentsDialog({
  materialId,
  materialName,
  open,
  onOpenChange,
}: MaterialCommentsDialogProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const REACTION_EMOJIS = ["👍", "❤️", "💡"];

  const { data: comments = [], refetch } = trpc.library.getMaterialComments.useQuery(
    { materialId },
    { enabled: open }
  );

  const commentIds = comments.map((c) => c.id);
  const { data: userReactions = [] } = trpc.library.getUserReactionsForComments.useQuery(
    { commentIds },
    { enabled: commentIds.length > 0 }
  );

  const toggleReactionMutation = trpc.library.toggleCommentReaction.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const createMutation = trpc.library.createMaterialComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setNewComment("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const updateMutation = trpc.library.updateMaterialComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário atualizado!");
      setEditingCommentId(null);
      setEditContent("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteMutation = trpc.library.deleteMaterialComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário eliminado!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const togglePinMutation = trpc.library.togglePinMaterialComment.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPinned ? "Comentário fixado!" : "Comentário desafixado!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    createMutation.mutate({
      materialId,
      content: newComment.trim(),
    });
  };

  const handleUpdate = (commentId: number) => {
    if (!editContent.trim()) return;

    updateMutation.mutate({
      commentId,
      content: editContent.trim(),
    });
  };

  const handleDelete = (commentId: number) => {
    if (confirm("Tem certeza que deseja eliminar este comentário?")) {
      deleteMutation.mutate({ commentId });
    }
  };

  const handleStartEdit = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#5F5C59]">
            <MessageSquare className="w-5 h-5 text-[#C9A882]" />
            Comentários - {materialName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || createMutation.isPending}
                className="bg-[#C9A882] hover:bg-[#B8976F]"
              >
                <Send className="w-4 h-4 mr-2" />
                {createMutation.isPending ? "A enviar..." : "Enviar"}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-[#C3BAAF] mb-3" />
              <p className="text-[#5F5C59]">Ainda não há comentários</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seja o primeiro a comentar sobre este material
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isAuthor = user?.id === comment.user.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <Card
                    key={comment.id}
                    className={`${
                      comment.isPinned
                        ? "border-[#C9A882] bg-[#C9A882]/5"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {comment.user.avatarUrl ? (
                            <img
                              src={comment.user.avatarUrl}
                              alt={comment.user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#C9A882] flex items-center justify-center text-white font-semibold">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#5F5C59]">
                                  {comment.user.name}
                                </span>
                                {comment.isPinned && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-[#C9A882] text-white text-xs"
                                  >
                                    <Pin className="w-3 h-3 mr-1" />
                                    Fixado
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                                {comment.updatedAt !== comment.createdAt && " (editado)"}
                              </span>
                            </div>

                            {/* Actions (only for author) */}
                            {isAuthor && !isEditing && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePinMutation.mutate({ commentId: comment.id })}
                                  disabled={togglePinMutation.isPending}
                                  title={comment.isPinned ? "Desafixar" : "Fixar"}
                                >
                                  <Pin
                                    className={`w-4 h-4 ${
                                      comment.isPinned ? "fill-current text-[#C9A882]" : ""
                                    }`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(comment.id, comment.content)}
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(comment.id)}
                                  disabled={deleteMutation.isPending}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Comment Content or Edit Form */}
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] resize-none"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdate(comment.id)}
                                  disabled={!editContent.trim() || updateMutation.isPending}
                                  className="bg-[#C9A882] hover:bg-[#B8976F]"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[#5F5C59] whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>

                              {/* Reactions */}
                              <div className="flex items-center gap-2 mt-3">
                                {REACTION_EMOJIS.map((emoji) => {
                                  const hasReacted = userReactions.some(
                                    (r) => r.commentId === comment.id && r.emoji === emoji
                                  );
                                  return (
                                    <Button
                                      key={emoji}
                                      variant="outline"
                                      size="sm"
                                      className={`h-7 px-2 text-sm ${
                                        hasReacted ? "bg-[#C9A882]/10 border-[#C9A882]" : ""
                                      }`}
                                      onClick={() =>
                                        toggleReactionMutation.mutate({
                                          commentId: comment.id,
                                          emoji,
                                        })
                                      }
                                    >
                                      <span>{emoji}</span>
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
