import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MentionInput, MentionText } from "@/components/MentionInput";
import { Loader2, MessageCircle, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ScenarioCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: number;
  scenarioName: string;
}

interface CommentItemProps {
  comment: any;
  level: number;
  onReply: (commentId: number, parentAuthor: string) => void;
  onDelete: (commentId: number) => void;
  currentUserId: number;
}

function CommentItem({ comment, level, onReply, onDelete, currentUserId }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);

  const { refetch: fetchReplies } = trpc.scenarioSharing.getCommentReplies.useQuery(
    { commentId: comment.id },
    { 
      enabled: false,
      onSuccess: (data) => {
        setReplies(data);
        setLoadingReplies(false);
      }
    }
  );

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0 && comment.replyCount > 0) {
      setLoadingReplies(true);
      await fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const indentClass = level === 0 ? "" : `ml-${Math.min(level * 8, 16)} border-l-2 border-border pl-4`;

  return (
    <div className={`${indentClass}`}>
      <div className="bg-muted/30 rounded-lg p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.userName || "Usuário"}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
              {level > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Resposta
                </span>
              )}
            </div>
            <div className="text-sm whitespace-pre-wrap">
              <MentionText text={comment.comment} />
            </div>
          </div>
          {comment.userId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onReply(comment.id, comment.userName || "Usuário")}
          >
            <Reply className="h-3 w-3 mr-1" />
            Responder
          </Button>
          
          {comment.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleToggleReplies}
              disabled={loadingReplies}
            >
              {loadingReplies ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : showReplies ? (
                <ChevronUp className="h-3 w-3 mr-1" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
              {comment.replyCount} {comment.replyCount === 1 ? "resposta" : "respostas"}
            </Button>
          )}
        </div>
      </div>

      {showReplies && replies.length > 0 && (
        <div className="space-y-2 mb-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenarioCommentsDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioName,
}: ScenarioCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; author: string } | null>(null);
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
        parentCommentId: replyingTo?.id,
      });
      
      toast.success(replyingTo ? "Resposta adicionada" : "Comentário adicionado");
      setNewComment("");
      setReplyingTo(null);
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

  const handleReply = (commentId: number, author: string) => {
    setReplyingTo({ id: commentId, author });
    // Focar no textarea
    setTimeout(() => {
      document.getElementById("comment-textarea")?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comentários do Cenário
          </DialogTitle>
          <DialogDescription>
            {scenarioName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {!comments || comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                level={0}
                onReply={handleReply}
                onDelete={handleDeleteComment}
                currentUserId={user?.id || 0}
              />
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          {replyingTo && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Reply className="h-4 w-4 text-primary" />
                <span>Respondendo a <span className="font-medium">{replyingTo.author}</span></span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelReply}
                className="h-7"
              >
                Cancelar
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                placeholder={replyingTo ? "Digite sua resposta... Use @ para mencionar alguém" : "Digite seu comentário... Use @ para mencionar alguém"}
                className="min-h-[80px] resize-none"
                onSubmit={handleAddComment}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              
            </span>
            <Button
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !newComment.trim()}
            >
              {addCommentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {replyingTo ? "Responder" : "Comentar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
