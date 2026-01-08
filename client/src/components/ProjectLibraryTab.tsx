import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Package, Box, Sparkles, Trash2, Edit, Download, Euro } from "lucide-react";
import { toast } from "sonner";

interface ProjectLibraryTabProps {
  projectId: number;
}

export function ProjectLibraryTab({ projectId }: ProjectLibraryTabProps) {
  const [editMaterialDialog, setEditMaterialDialog] = useState<{
    open: boolean;
    id: number;
    quantity: string;
    unitPrice: string;
    notes: string;
    status: string;
  } | null>(null);

  // Queries
  const { data: materials = [], refetch: refetchMaterials } =
    trpc.library.projectMaterials.list.useQuery({ projectId });
  const { data: models = [], refetch: refetchModels } =
    trpc.library.projectModels.list.useQuery({ projectId });
  const { data: inspirations = [], refetch: refetchInspiration } =
    trpc.library.projectInspiration.list.useQuery({ projectId });
  const { data: totalCost } = trpc.library.projectMaterials.totalCost.useQuery({ projectId });

  // Mutations
  const updateMaterial = trpc.library.projectMaterials.update.useMutation({
    onSuccess: () => {
      toast.success("Material atualizado!");
      setEditMaterialDialog(null);
      refetchMaterials();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const removeMaterial = trpc.library.projectMaterials.remove.useMutation({
    onSuccess: () => {
      toast.success("Material removido do projeto");
      refetchMaterials();
    },
  });

  const removeModel = trpc.library.projectModels.remove.useMutation({
    onSuccess: () => {
      toast.success("Modelo removido do projeto");
      refetchModels();
    },
  });

  const removeInspiration = trpc.library.projectInspiration.remove.useMutation({
    onSuccess: () => {
      toast.success("Inspiração removida do projeto");
      refetchInspiration();
    },
  });

  const handleUpdateMaterial = () => {
    if (!editMaterialDialog) return;

    updateMaterial.mutate({
      id: editMaterialDialog.id,
      quantity: editMaterialDialog.quantity,
      unitPrice: editMaterialDialog.unitPrice || undefined,
      notes: editMaterialDialog.notes || undefined,
      status: editMaterialDialog.status as any,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="bg-[#EEEAE5]/50 border border-[#C3BAAF]/20">
          <TabsTrigger
            value="materials"
            className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]"
          >
            <Package className="w-4 h-4 mr-2" />
            Materiais ({materials.length})
          </TabsTrigger>
          <TabsTrigger
            value="models"
            className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]"
          >
            <Box className="w-4 h-4 mr-2" />
            Modelos 3D ({models.length})
          </TabsTrigger>
          <TabsTrigger
            value="inspiration"
            className="data-[state=active]:bg-white data-[state=active]:text-[#5F5C59]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Inspiração ({inspirations.length})
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          {/* Cost Summary */}
          {totalCost && parseFloat(totalCost) > 0 && (
            <Card className="bg-[#C9A882]/10 border-[#C9A882]/30">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-[#5F5C59] flex items-center">
                  <Euro className="w-5 h-5 mr-2" />
                  Custo Total Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#5F5C59]">{totalCost} €</p>
              </CardContent>
            </Card>
          )}

          {materials.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                <p className="text-[#5F5C59]">Nenhum material associado a este projeto</p>
                <p className="text-sm text-[#C3BAAF] mt-2">
                  Vá à Biblioteca para adicionar materiais
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-serif text-[#5F5C59]">
                          {item.material?.name}
                        </CardTitle>
                        <CardDescription>{item.material?.description}</CardDescription>
                      </div>
                      <Badge className="bg-[#C9A882]">{item.material?.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-[#C3BAAF]">Quantidade:</span>
                        <p className="font-medium text-[#5F5C59]">
                          {item.quantity} {item.material?.unit}
                        </p>
                      </div>
                      {item.unitPrice && (
                        <div>
                          <span className="text-[#C3BAAF]">Preço Unit.:</span>
                          <p className="font-medium text-[#5F5C59]">{item.unitPrice} €</p>
                        </div>
                      )}
                      {item.totalPrice && (
                        <div>
                          <span className="text-[#C3BAAF]">Total:</span>
                          <p className="font-medium text-[#5F5C59]">{item.totalPrice} €</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[#C3BAAF]">Estado:</span>
                        <Badge variant="outline" className="ml-2">
                          {item.status === "planned" && "Planeado"}
                          {item.status === "ordered" && "Encomendado"}
                          {item.status === "delivered" && "Entregue"}
                          {item.status === "installed" && "Instalado"}
                        </Badge>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="pt-2 border-t border-[#C3BAAF]/20">
                        <span className="text-xs text-[#C3BAAF]">Notas:</span>
                        <p className="text-sm text-[#5F5C59] mt-1">{item.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditMaterialDialog({
                          open: true,
                          id: item.id,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice || "",
                          notes: item.notes || "",
                          status: item.status,
                        })
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    {item.material?.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.material.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Ficha
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          {models.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Box className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                <p className="text-[#5F5C59]">Nenhum modelo 3D associado a este projeto</p>
                <p className="text-sm text-[#C3BAAF] mt-2">
                  Vá à Biblioteca para adicionar modelos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {models.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  {item.model?.thumbnailUrl && (
                    <img
                      src={item.model.thumbnailUrl}
                      alt={item.model.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg font-serif text-[#5F5C59]">
                      {item.model?.name}
                    </CardTitle>
                    <CardDescription>{item.model?.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {item.location && (
                      <div>
                        <span className="text-xs text-[#C3BAAF]">Localização:</span>
                        <p className="text-sm text-[#5F5C59]">{item.location}</p>
                      </div>
                    )}
                    {item.notes && (
                      <div>
                        <span className="text-xs text-[#C3BAAF]">Notas:</span>
                        <p className="text-sm text-[#5F5C59]">{item.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={item.model?.modelUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModel.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inspiration Tab */}
        <TabsContent value="inspiration" className="space-y-4">
          {inspirations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Sparkles className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                <p className="text-[#5F5C59]">Nenhuma inspiração associada a este projeto</p>
                <p className="text-sm text-[#C3BAAF] mt-2">
                  Vá à Biblioteca para adicionar inspirações
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {inspirations.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <img
                    src={item.inspiration?.imageUrl}
                    alt={item.inspiration?.title}
                    className="w-full h-64 object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="text-lg font-serif text-[#5F5C59]">
                      {item.inspiration?.title}
                    </CardTitle>
                    {item.inspiration?.description && (
                      <CardDescription>{item.inspiration.description}</CardDescription>
                    )}
                  </CardHeader>
                  {item.notes && (
                    <CardContent>
                      <span className="text-xs text-[#C3BAAF]">Notas:</span>
                      <p className="text-sm text-[#5F5C59] mt-1">{item.notes}</p>
                    </CardContent>
                  )}
                  <CardFooter className="flex gap-2">
                    {item.inspiration?.sourceUrl && (
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a
                          href={item.inspiration.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver Fonte
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInspiration.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Material Dialog */}
      {editMaterialDialog && (
        <Dialog
          open={editMaterialDialog.open}
          onOpenChange={(open) => !open && setEditMaterialDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
                Editar Material
              </DialogTitle>
              <DialogDescription>
                Atualize a quantidade, preço ou estado do material
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editMaterialDialog.quantity}
                    onChange={(e) =>
                      setEditMaterialDialog({ ...editMaterialDialog, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Preço Unitário (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editMaterialDialog.unitPrice}
                    onChange={(e) =>
                      setEditMaterialDialog({ ...editMaterialDialog, unitPrice: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Estado</Label>
                <Select
                  value={editMaterialDialog.status}
                  onValueChange={(value) =>
                    setEditMaterialDialog({ ...editMaterialDialog, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planeado</SelectItem>
                    <SelectItem value="ordered">Encomendado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="installed">Instalado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={editMaterialDialog.notes}
                  onChange={(e) =>
                    setEditMaterialDialog({ ...editMaterialDialog, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditMaterialDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateMaterial}
                disabled={updateMaterial.isPending}
                className="bg-[#C9A882] hover:bg-[#B8976F]"
              >
                {updateMaterial.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
