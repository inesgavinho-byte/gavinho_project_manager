import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SkillCard } from "./SkillCard";
import { AddSkillDialog } from "./AddSkillDialog";
import { EditSkillDialog } from "./EditSkillDialog";
import { Award, Plus, Search, Zap } from "lucide-react";
import type { UserSkill } from "@shared/types";

interface SkillsManagerProps {
  userId?: number;
}

export function SkillsManager({ userId }: SkillsManagerProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: skills, isLoading, refetch } = trpc.userSkills.getMySkills.useQuery();
  const { data: stats } = trpc.userSkills.getSkillStats.useQuery();

  const deleteSkillMutation = trpc.userSkills.deleteSkill.useMutation({
    onSuccess: () => {
      toast({
        title: "Competência eliminada",
        description: "A competência foi removida com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endorseSkillMutation = trpc.userSkills.endorseSkill.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao endossar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSkill = (skillId: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta competência?")) {
      deleteSkillMutation.mutate({ skillId });
    }
  };

  const handleEditSkill = (skill: UserSkill) => {
    setEditingSkill(skill);
    setEditDialogOpen(true);
  };

  const handleSkillUpdated = () => {
    refetch();
    setEditDialogOpen(false);
    setEditingSkill(null);
  };

  const handleSkillAdded = () => {
    refetch();
    setAddDialogOpen(false);
  };

  const filteredSkills = skills?.filter((skill) =>
    skill.skillName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total de Competências</p>
                <p className="text-3xl font-bold text-brown">{stats.totalSkills}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nível Expert</p>
                <p className="text-3xl font-bold text-sand">{stats.expertCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Endossos</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-brown">{stats.totalEndorsements}</p>
                  <Zap className="h-5 w-5 text-sand" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Experiência Média</p>
                <p className="text-3xl font-bold text-brown">
                  {stats.averageYearsExperience.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">anos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Add */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar competências..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-brown hover:bg-brown/90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Competência
        </Button>
      </div>

      {/* Skills List */}
      {filteredSkills.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="pt-12 pb-12 text-center">
            <Award className="h-12 w-12 text-sand/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Nenhuma competência encontrada"
                : "Ainda não tem competências adicionadas"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                variant="outline"
                className="border-brown/20 text-brown hover:bg-brown/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Competência
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={() => handleEditSkill(skill)}
              onDelete={() => handleDeleteSkill(skill.id)}
              onEndorse={() => endorseSkillMutation.mutate({ skillId: skill.id })}
              isEndorsing={endorseSkillMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddSkillDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSkillAdded}
      />

      {editingSkill && (
        <EditSkillDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          skill={editingSkill}
          onSuccess={handleSkillUpdated}
        />
      )}
    </div>
  );
}
