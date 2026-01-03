import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ScenarioCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: number;
  scenarioName: string;
}

export default function ScenarioCommentsDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioName,
}: ScenarioCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();

  const { data: comments, refetch: refetchComments } = trpc.scenarioSharing.getComments.useQuery(
    { scenarioId },
    { enabled: open }
  );
  
  const addCommentMutation = trpc.scenarioSharing.addComment.useMutation();
  const deleteCommentMutation = trpc.scenarioSharing.deleteComment.useMutation();

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Digite um comentário");
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        scenarioId,
        comment: newComment,
      });
      
      toast.success("Comentário adicionado");
      setNewComment("");
      refetchComments();
    } catch (error) {
      toast.error("Erro ao adicionar comentário");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteCommentMutation.mutateAsync({ commentId });
      toast.success("Comentário removido");
      refetchComments();
    } catch (error) {
      toast.error("Erro ao remover comentário");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários do Cenário
          </DialogTitle>
          <DialogDescription>
            Discussão sobre "{scenarioName}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{comment.userName || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  {user?.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddComment}
            disabled={addCommentMutation.isPending || !newComment.trim()}
            className="w-full"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            Adicionar Comentário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
