import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

// Sugestões de tags pré-definidas organizadas por tipo
export const SUGGESTED_TAGS = {
  projects: [
    { name: "Residencial", color: "#C9A882" },
    { name: "Comercial", color: "#8B8670" },
    { name: "Hotelaria", color: "#ADAA96" },
    { name: "Restauração", color: "#5F5C59" },
    { name: "Escritórios", color: "#C9A882" },
    { name: "Retail", color: "#8B8670" },
    { name: "Saúde", color: "#ADAA96" },
    { name: "Educação", color: "#5F5C59" },
  ],
  clients: [
    { name: "Cliente Premium", color: "#C9A882" },
    { name: "Cliente VIP", color: "#8B8670" },
    { name: "Cliente Corporativo", color: "#ADAA96" },
    { name: "Cliente Particular", color: "#5F5C59" },
  ],
  workTypes: [
    { name: "Obra Nova", color: "#C9A882" },
    { name: "Remodelação", color: "#8B8670" },
    { name: "Reabilitação", color: "#ADAA96" },
    { name: "Manutenção", color: "#5F5C59" },
    { name: "Ampliação", color: "#C9A882" },
    { name: "Decoração", color: "#8B8670" },
  ],
  materials: [
    { name: "Sustentável", color: "#7FB069" },
    { name: "Reciclado", color: "#52796F" },
    { name: "Natural", color: "#8B8670" },
    { name: "Sintético", color: "#ADAA96" },
    { name: "Certificado", color: "#C9A882" },
    { name: "Local", color: "#5F5C59" },
  ],
  styles: [
    { name: "Minimalista", color: "#E5E2D9" },
    { name: "Clássico", color: "#C9A882" },
    { name: "Contemporâneo", color: "#8B8670" },
    { name: "Industrial", color: "#5F5C59" },
    { name: "Escandinavo", color: "#ADAA96" },
    { name: "Mediterrâneo", color: "#C9A882" },
  ],
};

interface CustomTagsHelperProps {
  onSelectTag: (tagName: string, tagColor: string) => void;
}

export function CustomTagsHelper({ onSelectTag }: CustomTagsHelperProps) {
  return (
    <div className="space-y-4 p-4 bg-[#F2F0E7] rounded-lg border border-[#E5E2D9]">
      <h4 className="text-sm font-semibold text-[#5F5C59]">
        Sugestões de Etiquetas Personalizadas
      </h4>
      <p className="text-xs text-[#8B8670]">
        Clique numa sugestão para criar rapidamente uma etiqueta personalizada
      </p>

      {/* Projetos */}
      <div>
        <div className="text-xs font-medium text-[#8B8670] mb-2">Por Tipo de Projeto</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.projects.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer hover:bg-[#C9A882]/10 transition-colors"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onSelectTag(tag.name, tag.color)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clientes */}
      <div>
        <div className="text-xs font-medium text-[#8B8670] mb-2">Por Tipo de Cliente</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.clients.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer hover:bg-[#C9A882]/10 transition-colors"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onSelectTag(tag.name, tag.color)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tipos de Obra */}
      <div>
        <div className="text-xs font-medium text-[#8B8670] mb-2">Por Tipo de Obra</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.workTypes.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer hover:bg-[#C9A882]/10 transition-colors"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onSelectTag(tag.name, tag.color)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Materiais */}
      <div>
        <div className="text-xs font-medium text-[#8B8670] mb-2">Por Características do Material</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.materials.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer hover:bg-[#C9A882]/10 transition-colors"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onSelectTag(tag.name, tag.color)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Estilos */}
      <div>
        <div className="text-xs font-medium text-[#8B8670] mb-2">Por Estilo</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.styles.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className="cursor-pointer hover:bg-[#C9A882]/10 transition-colors"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onSelectTag(tag.name, tag.color)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
