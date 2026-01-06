import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, MessageSquare, History } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RenderApprovalModalProps {
  render: {
    id: number;
    name: string;
    approvalStatus: "pending" | "in_review" | "approved" | "rejected";
    rejectionReason?: string | null;
    fileUrl: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RenderApprovalModal({ render, open, onOpenChange, onSuccess }: RenderApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<"approve" | "comments" | "history">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newComment, setNewComment] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: comments = [], isLoading: commentsLoading } = trpc.projects.archviz.comments.list.useQuery(
    { renderId: render.id },
    { enabled: open && activeTab === "comments" }
  );

  const { data: history = [], isLoading: historyLoading } = trpc.projects.archviz.history.get.useQuery(
    { renderId: render.id },
    { enabled: open && activeTab === "history" }
  );

  // Mutations
  const approveMutation = trpc.projects.archviz.approval.approve.useMutation({
    onSuccess: () => {
      toast.success("Render aprovado com sucesso!");
      utils.projects.archviz.renders.list.invalidate();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar render: ${error.message}`);
    },
  });

  const rejectMutation = trpc.projects.archviz.approval.reject.useMutation({
    onSuccess: () => {
      toast.success("Render rejeitado");
      utils.projects.archviz.renders.list.invalidate();
      onSuccess();
      onOpenChange(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar render: ${error.message}`);
    },
  });

  const setInReviewMutation = trpc.projects.archviz.approval.setInReview.useMutation({
    onSuccess: () => {
      toast.success("Render marcado como em revisão");
      utils.projects.archviz.renders.list.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const addCommentMutation = trpc.projects.archviz.comments.add.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado");
      utils.projects.archviz.comments.list.invalidate({ renderId: render.id });
      setNewComment("");
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ renderId: render.id });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Por favor, forneça um motivo para a rejeição");
      return;
    }
    rejectMutation.mutate({ renderId: render.id, reason: rejectionReason });
  };

  const handleSetInReview = () => {
    setInReviewMutation.mutate({ renderId: render.id });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }
    addCommentMutation.mutate({ renderId: render.id, comment: newComment });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
      case "in_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-500"><Clock className="w-3 h-3" /> Em Revisão</Badge>;
      case "approved":
        return <Badge variant="outline" className="gap-1 border-green-500 text-green-500"><CheckCircle2 className="w-3 h-3" /> Aprovado</Badge>;
      case "rejected":
        return <Badge variant="outline" className="gap-1 border-red-500 text-red-500"><XCircle className="w-3 h-3" /> Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created": return "Criado";
      case "status_changed": return "Status alterado";
      case "approved": return "Aprovado";
      case "rejected": return "Rejeitado";
      case "commented": return "Comentou";
      default: return action;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {render.name}
            {getStatusBadge(render.approvalStatus)}
          </DialogTitle>
          <DialogDescription>
            Gerir aprovação e feedback do render
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <img 
              src={render.fileUrl} 
              alt={render.name}
              className="w-full rounded-lg border"
            />
          </div>

          {/* Actions & Info */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab("approve")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "approve"
                    ? "border-b-2 border-[#C9A882] text-[#C9A882]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aprovação
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "comments"
                    ? "border-b-2 border-[#C9A882] text-[#C9A882]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Comentários
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-1 ${
                  activeTab === "history"
                    ? "border-b-2 border-[#C9A882] text-[#C9A882]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="w-4 h-4" />
                Histórico
              </button>
            </div>

            {/* Approve Tab */}
            {activeTab === "approve" && (
              <div className="space-y-4">
                {render.approvalStatus === "pending" && (
                  <>
                    <Button
                      onClick={handleSetInReview}
                      variant="outline"
                      className="w-full"
                      disabled={setInReviewMutation.isPending}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Marcar como Em Revisão
                    </Button>

                    <Button
                      onClick={handleApprove}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar Render
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Explique o motivo da rejeição..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleReject}
                        variant="destructive"
                        className="w-full"
                        disabled={rejectMutation.isPending || !rejectionReason.trim()}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar Render
                      </Button>
                    </div>
                  </>
                )}

                {render.approvalStatus === "in_review" && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Este render está em revisão. Pode aprová-lo ou rejeitá-lo.
                    </p>

                    <Button
                      onClick={handleApprove}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar Render
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Explique o motivo da rejeição..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={handleReject}
                        variant="destructive"
                        className="w-full"
                        disabled={rejectMutation.isPending || !rejectionReason.trim()}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar Render
                      </Button>
                    </div>
                  </>
                )}

                {render.approvalStatus === "approved" && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ Este render foi aprovado
                    </p>
                  </div>
                )}

                {render.approvalStatus === "rejected" && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      ✗ Este render foi rejeitado
                    </p>
                    {render.rejectionReason && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Motivo: {render.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-comment">Adicionar Comentário</Label>
                  <Textarea
                    id="new-comment"
                    placeholder="Escreva o seu feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="w-full"
                  >
                    Adicionar Comentário
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {commentsLoading ? (
                    <p className="text-sm text-muted-foreground">A carregar comentários...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-muted rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{comment.user?.name || "Utilizador"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString("pt-PT")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground">A carregar histórico...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="p-3 bg-muted rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {entry.user?.name || "Utilizador"} • {getActionLabel(entry.action)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString("pt-PT")}
                        </span>
                      </div>
                      {entry.newValue && (
                        <p className="text-sm text-muted-foreground">
                          Novo estado: <span className="font-medium">{entry.newValue}</span>
                        </p>
                      )}
                      {entry.comment && (
                        <p className="text-sm">{entry.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
