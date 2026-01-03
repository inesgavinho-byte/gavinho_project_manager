import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Users } from "lucide-react";
import { toast } from "sonner";

interface ScenarioSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: number;
  scenarioName: string;
}

export default function ScenarioSharingDialog({
  open,
  onOpenChange,
  scenarioId,
  scenarioName,
}: ScenarioSharingDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view");

  const { data: teamMembers } = trpc.scenarioSharing.getTeamMembers.useQuery();
  const { data: shares, refetch: refetchShares } = trpc.scenarioSharing.getScenarioShares.useQuery(
    { scenarioId },
    { enabled: open }
  );
  
  const shareMutation = trpc.scenarioSharing.shareScenario.useMutation();
  const unshareMutation = trpc.scenarioSharing.unshareScenario.useMutation();

  const handleShare = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um membro da equipe");
      return;
    }

    try {
      await shareMutation.mutateAsync({
        scenarioId,
        sharedWith: parseInt(selectedUserId),
        permission,
      });
      
      toast.success("Cenário compartilhado com sucesso");
      setSelectedUserId("");
      refetchShares();
    } catch (error) {
      toast.error("Erro ao compartilhar cenário");
    }
  };

  const handleUnshare = async (sharedWith: number) => {
    try {
      await unshareMutation.mutateAsync({
        scenarioId,
        sharedWith,
      });
      
      toast.success("Compartilhamento removido");
      refetchShares();
    } catch (error) {
      toast.error("Erro ao remover compartilhamento");
    }
  };

  const getPermissionBadge = (perm: string) => {
    const colors = {
      view: "bg-blue-100 text-blue-800",
      edit: "bg-green-100 text-green-800",
      admin: "bg-purple-100 text-purple-800",
    };
    return colors[perm as keyof typeof colors] || colors.view;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartilhar Cenário
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{scenarioName}" com membros da equipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new share */}
          <div className="space-y-4">
            <h3 className="font-semibold">Adicionar Acesso</h3>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={permission} onValueChange={(v) => setPermission(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleShare}
                disabled={shareMutation.isPending || !selectedUserId}
              >
                {shareMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Compartilhar"
                )}
              </Button>
            </div>
          </div>

          {/* Current shares */}
          <div className="space-y-4">
            <h3 className="font-semibold">Compartilhado Com</h3>
            {shares && shares.length > 0 ? (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{share.userName || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">{share.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPermissionBadge(share.permission)}>
                        {share.permission === "view" && "Visualizar"}
                        {share.permission === "edit" && "Editar"}
                        {share.permission === "admin" && "Admin"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshare(share.sharedWith)}
                        disabled={unshareMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este cenário ainda não foi compartilhado
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
