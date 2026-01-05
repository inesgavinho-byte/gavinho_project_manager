import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Trash2, Edit, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ArchVizEditModal } from "./ArchVizEditModal";

interface Render {
  id: number;
  name: string;
  description?: string | null;
  version: number;
  fileUrl: string;
  thumbnailUrl?: string | null;
  isFavorite: boolean;
  status: "pending" | "approved_dc" | "approved_client";
  compartmentId: number;
  createdAt: Date;
}

interface Compartment {
  id: number;
  name: string;
  description?: string | null;
}

interface ArchVizGalleryProps {
  constructionId: number;
  compartments: Compartment[];
  renders: Render[];
  onRefresh: () => void;
}

export function ArchVizGallery({ constructionId, compartments, renders, onRefresh }: ArchVizGalleryProps) {
  const [expandedCompartments, setExpandedCompartments] = useState<Set<number>>(
    new Set(compartments.map(c => c.id))
  );
  const [editingRender, setEditingRender] = useState<Render | null>(null);

  const toggleFavoriteMutation = trpc.archviz.renders.toggleFavorite.useMutation({
    onSuccess: onRefresh,
  });

  const deleteRenderMutation = trpc.archviz.renders.delete.useMutation({
    onSuccess: onRefresh,
  });

  const toggleCompartment = (id: number) => {
    setExpandedCompartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100">Pendente</Badge>;
      case "approved_dc":
        return <Badge className="bg-blue-500 text-white">Aprovada DC</Badge>;
      case "approved_client":
        return <Badge className="bg-green-600 text-white">Aprovada DC + Cliente</Badge>;
      default:
        return null;
    }
  };

  const getCardStyle = (status: string) => {
    if (status === "approved_client") {
      return "bg-gradient-to-br from-gray-900 to-gray-800 text-white border-green-600 border-2";
    }
    if (status === "approved_dc") {
      return "bg-gradient-to-br from-blue-900 to-blue-800 text-white border-blue-500 border-2";
    }
    return "";
  };

  const groupedRenders = compartments.map(comp => ({
    compartment: comp,
    renders: renders.filter(r => r.compartmentId === comp.id),
  }));

  return (
    <div className="space-y-6">
      {groupedRenders.map(({ compartment, renders: compRenders }) => (
        <div key={compartment.id} className="space-y-4">
          {/* Compartment Header */}
          <button
            onClick={() => toggleCompartment(compartment.id)}
            className="w-full flex items-center gap-2 p-4 bg-[#EEEAE5] rounded-lg hover:bg-[#E5E1DC] transition-colors"
          >
            {expandedCompartments.has(compartment.id) ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span className="font-medium text-lg">{compartment.name}</span>
            <Badge variant="outline" className="ml-auto">
              {compRenders.length} {compRenders.length === 1 ? "versão" : "versões"}
            </Badge>
          </button>

          {/* Renders Grid */}
          {expandedCompartments.has(compartment.id) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {compRenders.map(render => (
                <Card
                  key={render.id}
                  className={`overflow-hidden ${getCardStyle(render.status)}`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={render.thumbnailUrl || render.fileUrl}
                      alt={render.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {getStatusBadge(render.status)}
                    </div>
                    {render.isFavorite && (
                      <Star className="absolute top-2 left-2 w-5 h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-medium">Versão {render.version}</h4>
                      <p className={`text-sm ${render.status.includes("approved") ? "text-gray-300" : "text-gray-500"}`}>
                        {render.name}
                      </p>
                      <p className={`text-xs ${render.status.includes("approved") ? "text-gray-400" : "text-gray-400"} mt-1`}>
                        {new Date(render.createdAt).toLocaleDateString("pt-PT")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteMutation.mutate({ id: render.id, isFavorite: !render.isFavorite })}
                        className={render.status.includes("approved") ? "hover:bg-gray-700" : ""}
                      >
                        <Star className={`w-4 h-4 ${render.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRender(render)}
                        className={render.status.includes("approved") ? "hover:bg-gray-700" : ""}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(render.fileUrl, "_blank")}
                        className={render.status.includes("approved") ? "hover:bg-gray-700" : ""}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Tem a certeza que deseja apagar este render?")) {
                            deleteRenderMutation.mutate({ id: render.id });
                          }
                        }}
                        className={render.status.includes("approved") ? "hover:bg-gray-700 text-red-400" : "text-red-600"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editingRender && (
        <ArchVizEditModal
          open={!!editingRender}
          onOpenChange={(open) => !open && setEditingRender(null)}
          render={editingRender}
          compartments={compartments}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
