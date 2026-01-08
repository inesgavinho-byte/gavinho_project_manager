import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Folder, Plus, Eye, FolderPlus } from "lucide-react";
import { CollectionDetailView } from "../components/CollectionDetailView";
import { ManageCollectionsDialog } from "../components/ManageCollectionsDialog";

export function Collections() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const { data: collections = [], refetch } = trpc.library.getUserCollections.useQuery();
  const { data: stats } = trpc.library.getCollectionStats.useQuery();

  // If a collection is selected, show detail view
  if (selectedCollectionId) {
    return (
      <CollectionDetailView
        collectionId={selectedCollectionId}
        onBack={() => {
          setSelectedCollectionId(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#5F5C59]">
            Minhas Coleções
          </h1>
          <p className="text-[#C3BAAF] mt-1">
            Organize e gerencie os seus materiais em coleções personalizadas
          </p>
        </div>
        <Button
          onClick={() => setManageDialogOpen(true)}
          className="bg-[#C9A882] hover:bg-[#B8976F]"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Gerir Coleções
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Coleções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#C9A882]">
                {stats.totalCollections}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Materiais Organizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#C9A882]">
                {stats.totalMaterialsInCollections}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#C9A882]">
                {stats.totalFavorites}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="w-20 h-20 mx-auto text-[#C3BAAF] mb-4" />
          <h3 className="text-xl font-semibold text-[#5F5C59] mb-2">
            Ainda não tem coleções
          </h3>
          <p className="text-muted-foreground mb-6">
            Crie a sua primeira coleção para começar a organizar materiais
          </p>
          <Button
            onClick={() => setManageDialogOpen(true)}
            className="bg-[#C9A882] hover:bg-[#B8976F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Coleção
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedCollectionId(collection.id)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: collection.color || "#C3BAAF" }}
                  >
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-serif text-[#5F5C59] truncate">
                      {collection.name}
                    </CardTitle>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {collection.materialCount} materiais
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCollectionId(collection.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Atualizada: {new Date(collection.updatedAt).toLocaleDateString("pt-PT")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Collections Dialog */}
      <ManageCollectionsDialog
        open={manageDialogOpen}
        onOpenChange={(open) => {
          setManageDialogOpen(open);
          if (!open) refetch();
        }}
      />
    </div>
  );
}

export default Collections;
