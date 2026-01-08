import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Layers,
  Box,
  Sparkles,
  Search,
  Plus,
  Grid3x3,
  List,
  Download,
  Trash2,
  Edit,
  Tag,
  Settings,
} from "lucide-react";
import { AddMaterialDialog } from "../components/library/AddMaterialDialog";
import { Add3DModelDialog } from "../components/library/Add3DModelDialog";
import { AddInspirationDialog } from "../components/library/AddInspirationDialog";
import { ManageTagsDialog } from "../components/library/ManageTagsDialog";

// Categorias predefinidas para materiais
const MATERIAL_CATEGORIES = [
  "Art Deco",
  "Branco",
  "Clássico",
  "Contemporâneo",
  "Dourado",
  "Económico",
  "Escandinavo",
  "Indoor",
  "Industrial",
  "Luxo",
  "Madeira",
  "Mediterrâneo",
  "Minimalista",
  "Neutro",
  "Outdoor",
  "Premium",
  "Preto",
  "Rústico",
  "Sustentável",
];

export default function Library() {
  const [activeTab, setActiveTab] = useState<"materials" | "models" | "inspiration">("materials");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [add3DModelOpen, setAdd3DModelOpen] = useState(false);
  const [addInspirationOpen, setAddInspirationOpen] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);

  // Queries
  const { data: materials = [], refetch: refetchMaterials } = trpc.library.materials.list.useQuery();
  const { data: models3D = [], refetch: refetchModels } = trpc.library.models3D.list.useQuery();
  const { data: inspiration = [], refetch: refetchInspiration } = trpc.library.inspiration.list.useQuery();
  const { data: tags = [] } = trpc.library.tags.list.useQuery();

  // Mutations
  const deleteMaterial = trpc.library.materials.delete.useMutation({
    onSuccess: () => refetchMaterials(),
  });
  const delete3DModel = trpc.library.models3D.delete.useMutation({
    onSuccess: () => refetchModels(),
  });
  const deleteInspiration = trpc.library.inspiration.delete.useMutation({
    onSuccess: () => refetchInspiration(),
  });

  // Filtrar dados
  const filteredMaterials = materials.filter((item) => {
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredModels = models3D.filter((item) => {
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredInspiration = inspiration.filter((item) => {
    const matchesSearch = searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch;
  });

  // Contadores
  const materialsCount = filteredMaterials.length;
  const modelsCount = filteredModels.length;
  const inspirationCount = filteredInspiration.length;

  return (
    <div className="min-h-screen bg-[#EEEAE5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-[#5F5C59] mb-2">Biblioteca</h1>
          <p className="text-[#C3BAAF]">Materiais, modelos 3D e inspiração</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white">
              <TabsTrigger value="materials" className="gap-2">
                <Layers className="w-4 h-4" />
                Materiais
                {materialsCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{materialsCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="models" className="gap-2">
                <Box className="w-4 h-4" />
                Modelos 3D
                {modelsCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{modelsCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="inspiration" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Inspiração
                {inspirationCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{inspirationCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageTagsOpen(true)}
              >
                <Tag className="w-4 h-4 mr-2" />
                Gerir Tags
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-[#C9A882] hover:bg-[#B8976F] text-white"
                onClick={() => {
                  if (activeTab === "materials") setAddMaterialOpen(true);
                  if (activeTab === "models") setAdd3DModelOpen(true);
                  if (activeTab === "inspiration") setAddInspirationOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Filtros e Pesquisa */}
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C3BAAF]" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {activeTab !== "inspiration" && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-[#C9A882]" : ""}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#C9A882]" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filtros de tags (chips) */}
            <div className="flex flex-wrap gap-2">
              {MATERIAL_CATEGORIES.slice(0, 15).map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#C9A882] hover:bg-[#B8976F]"
                      : "hover:bg-[#EEEAE5]"
                  }`}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? "all" : cat)
                  }
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tab: Materiais */}
          <TabsContent value="materials" className="space-y-4">
            {filteredMaterials.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Layers className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                  <p className="text-[#5F5C59] mb-4">Ainda não há materiais</p>
                  <Button
                    onClick={() => setAddMaterialOpen(true)}
                    className="bg-[#C9A882] hover:bg-[#B8976F]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Material
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredMaterials.map((material) => (
                  <Card key={material.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {material.imageUrl && (
                      <img
                        src={material.imageUrl}
                        alt={material.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-serif text-[#5F5C59]">
                            {material.name}
                          </CardTitle>
                          <CardDescription>{material.description}</CardDescription>
                        </div>
                        <Badge className="bg-[#C9A882]">{material.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {material.supplier && (
                        <p className="text-sm text-[#C3BAAF]">
                          Fornecedor: {material.supplier}
                        </p>
                      )}
                      {material.price && (
                        <p className="text-sm font-medium text-[#5F5C59] mt-1">
                          {material.price} € / {material.unit || "un"}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      {material.fileUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Ficha Técnica
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMaterial.mutate({ id: material.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Modelos 3D */}
          <TabsContent value="models" className="space-y-4">
            {filteredModels.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Box className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                  <p className="text-[#5F5C59] mb-4">Ainda não há modelos 3D</p>
                  <Button
                    onClick={() => setAdd3DModelOpen(true)}
                    className="bg-[#C9A882] hover:bg-[#B8976F]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Modelo 3D
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {filteredModels.map((model) => (
                  <Card key={model.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {model.thumbnailUrl && (
                      <img
                        src={model.thumbnailUrl}
                        alt={model.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-serif text-[#5F5C59]">
                            {model.name}
                          </CardTitle>
                          <CardDescription>{model.description}</CardDescription>
                        </div>
                        <Badge className="bg-[#C9A882]">{model.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-[#C3BAAF]">
                        <span>{model.fileFormat}</span>
                        {model.fileSize && (
                          <span>{(model.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={model.modelUrl} download>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => delete3DModel.mutate({ id: model.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Inspiração */}
          <TabsContent value="inspiration" className="space-y-4">
            {filteredInspiration.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Sparkles className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
                  <p className="text-[#5F5C59] mb-4">Ainda não há inspirações</p>
                  <Button
                    onClick={() => setAddInspirationOpen(true)}
                    className="bg-[#C9A882] hover:bg-[#B8976F]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Inspiração
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {filteredInspiration.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-64 object-cover"
                    />
                    <CardHeader>
                      <CardTitle className="text-lg font-serif text-[#5F5C59]">
                        {item.title}
                      </CardTitle>
                      {item.description && (
                        <CardDescription>{item.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="flex gap-2">
                      {item.sourceUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                            Ver Fonte
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInspiration.mutate({ id: item.id })}
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
      </div>

      {/* Modals */}
      <AddMaterialDialog
        open={addMaterialOpen}
        onOpenChange={setAddMaterialOpen}
        onSuccess={() => {
          refetchMaterials();
          setAddMaterialOpen(false);
        }}
      />
      <Add3DModelDialog
        open={add3DModelOpen}
        onOpenChange={setAdd3DModelOpen}
        onSuccess={() => {
          refetchModels();
          setAdd3DModelOpen(false);
        }}
      />
      <AddInspirationDialog
        open={addInspirationOpen}
        onOpenChange={setAddInspirationOpen}
        onSuccess={() => {
          refetchInspiration();
          setAddInspirationOpen(false);
        }}
      />
      <ManageTagsDialog
        open={manageTagsOpen}
        onOpenChange={setManageTagsOpen}
      />
    </div>
  );
}
