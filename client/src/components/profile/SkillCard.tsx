import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ThumbsUp, Zap } from "lucide-react";
import type { UserSkill } from "@shared/types";

interface SkillCardProps {
  skill: UserSkill;
  onEdit?: () => void;
  onDelete?: () => void;
  onEndorse?: () => void;
  isEndorsing?: boolean;
}

const proficiencyColors: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: "bg-blue-100", text: "text-blue-800", label: "Iniciante" },
  intermediate: { bg: "bg-green-100", text: "text-green-800", label: "Intermédio" },
  advanced: { bg: "bg-orange-100", text: "text-orange-800", label: "Avançado" },
  expert: { bg: "bg-sand/20", text: "text-sand", label: "Especialista" },
};

export function SkillCard({
  skill,
  onEdit,
  onDelete,
  onEndorse,
  isEndorsing,
}: SkillCardProps) {
  const proficiency = proficiencyColors[skill.proficiencyLevel];

  return (
    <Card className="border-border/40 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">{skill.skillName}</h3>
              <Badge className={`${proficiency.bg} ${proficiency.text} border-0 mt-2`}>
                {proficiency.label}
              </Badge>
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-brown"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          {skill.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
          )}

          {/* Experience and Endorsements */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {skill.yearsOfExperience > 0 && (
                <span>
                  {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? "ano" : "anos"} de
                  experiência
                </span>
              )}
            </div>
            {skill.endorsements > 0 && (
              <div className="flex items-center gap-1 text-sand font-semibold">
                <Zap className="h-4 w-4" />
                {skill.endorsements}
              </div>
            )}
          </div>

          {/* Endorse Button */}
          {onEndorse && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-sand/30 text-sand hover:bg-sand/5"
              onClick={onEndorse}
              disabled={isEndorsing}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {isEndorsing ? "Endossando..." : "Endossar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
