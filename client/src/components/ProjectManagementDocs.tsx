import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Upload, FileText, Download, Eye, Filter, X, Trash2, 
  FileCheck, FileSpreadsheet, Receipt, Users, Mail, Scale, Folder, FolderOpen, Lock
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProjectManagementDocsProps {
  projectId: number;
}

const MANAGEMENT_CATEGORIES = [
  { value: "contract", label: "Contratos", icon: FileCheck, color: "bg-blue-100 text-blue-700" },
  { value: "invoice", label: "Faturas", icon: FileSpreadsheet, color: "bg-green-100 text-green-700" },
  { value: "receipt", label: "Recibos", icon: Receipt, color: "bg-emerald-100 text-emerald-700" },
  { value: "meeting_minutes", label: "Atas de Reunião", icon: Users, color: "bg-purple-100 text-purple-700" },
  { value: "correspondence", label: "Correspondência", icon: Mail, color: "bg-orange-100 text-orange-700" },
  { value: "legal_document", label: "Documentos Legais", icon: Scale, color: "bg-red-100 text-red-700" },
  { value: "other", label: "Outros", icon: FileText, color: "bg-gray-100 text-gray-700" },
];

export default function ProjectManagementDocs({ projectId }: ProjectManagementDocsProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    category: "contract" as const,
    phaseId: null as number | null,
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has access (admin or project manager role)
  const hasAccess = user?.role === "admin" || user?.role === "user"; // Assuming "user" can be project manager

  const { data: documents, refetch: refetchDocuments } = trpc.projects.managementDocs.list.useQuery(
    { projectId },
    { enabled: hasAccess }
  );
  const { data: phases } = trpc.projects.phases.list.useQuery({ projectId });

  const uploadDocument = trpc.projects.managementDocs.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento administrativo enviado com sucesso!");
      setIsUploadOpen(false);
      setUploadData({ name: "", description: "", category: "contract", phaseId: null, file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetchDocuments();
    },
    onError: (error) => {
      toast.error("Erro ao enviar documento: " + error.message);
    },
  });

  const deleteDocument = trpc.projects.managementDocs.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento removido com sucesso!");
      refetchDocuments();
    },
    onError: (error) => {
      toast.error("Erro ao remover documento: " + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/msword",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use PDF, imagens ou documentos Office.");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 20MB)");
      return;
    }

    setUploadData({ ...uploadData, file, name: uploadData.name || file.name.replace(/\.[^/.]+$/, "") });
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.name) {
      toast.error("Nome e arquivo são obrigatórios");
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadDocument.mutate({
        projectId,
        phaseId: uploadData.phaseId,
        name: uploadData.name,
        description: uploadData.description,
        category: uploadData.category,
        fileData: base64.split(",")[1],
        fileType: uploadData.file!.type,
        fileSize: uploadData.file!.size,
      });
    };
    reader.readAsDataURL(uploadData.file);
  };

  const handleDelete = (docId: number) => {
    if (confirm("Tem certeza que deseja remover este documento?")) {
      deleteDocument.mutate({ documentId: docId });
    }
  };

  const getCategoryInfo = (category: string) => {
    return MANAGEMENT_CATEGORIES.find(c => c.value === category) || MANAGEMENT_CATEGORIES[MANAGEMENT_CATEGORIES.length - 1];
  };

  if (!hasAccess) {
    return (
      <Card className="p-12 text-center border-2">
        <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="font-serif text-xl text-gray-600 mb-2">Acesso Restrito</h3>
        <p className="text-gray-500">
          Este separador é visível apenas para Gestores de Projeto e Administração.
        </p>
      </Card>
    );
  }

  const filteredDocuments = documents?.filter(doc => {
    const categoryMatch = selectedCategory === "all" || doc.category === selectedCategory;
    const phaseMatch = selectedPhase === "all" || 
                       (selectedPhase === "no-phase" && !doc.phaseId) ||
                       (doc.phaseId && doc.phaseId.toString() === selectedPhase);
    return categoryMatch && phaseMatch;
  }) || [];

  // Group documents by phase
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const phaseKey = doc.phaseId ? `phase-${doc.phaseId}` : "no-phase";
    if (!acc[phaseKey]) acc[phaseKey] = [];
    acc[phaseKey].push(doc);
    return acc;
  }, {} as Record<string, typeof filteredDocuments>);

  const getPhaseInfo = (phaseId: number | null) => {
    if (!phaseId) return { name: "Sem Fase Associada", color: "text-gray-500" };
    const phase = phases?.find(p => p.id === phaseId);
    return {
      name: phase?.name || "Fase Desconhecida",
      color: phase?.status === "completed" ? "text-green-600" : 
             phase?.status === "in_progress" ? "text-blue-600" : "text-gray-500"
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-2xl text-[#5F5C59]">Gestão de Projeto</h3>
          <p className="text-sm text-gray-500 mt-1">
            Documentos administrativos • {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A882] hover:bg-[#B8976F] text-white">
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Enviar Documento Administrativo</DialogTitle>
              <DialogDescription>
                Adicione contratos, faturas, recibos, atas de reunião ou outros documentos administrativos. Tamanho máximo: 20MB
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                {uploadData.file && (
                  <p className="text-sm text-gray-500 mt-1">
                    {uploadData.file.name} ({(uploadData.file.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Nome do Documento *</Label>
                <Input
                  id="name"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="Ex: Contrato de Empreitada - MYRIAD"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Descrição opcional do documento..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={uploadData.category}
                    onValueChange={(value: any) => setUploadData({ ...uploadData, category: value })}
                  >
                    <SelectTrigger id="category" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANAGEMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phase">Fase (opcional)</Label>
                  <Select
                    value={uploadData.phaseId?.toString() || "none"}
                    onValueChange={(value) => setUploadData({ ...uploadData, phaseId: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger id="phase" className="mt-1">
                      <SelectValue placeholder="Sem fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem fase</SelectItem>
                      {phases?.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id.toString()}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadDocument.isPending || !uploadData.file || !uploadData.name}
                className="bg-[#C9A882] hover:bg-[#B8976F] text-white"
              >
                {uploadDocument.isPending ? "A enviar..." : "Enviar Documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {MANAGEMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPhase} onValueChange={setSelectedPhase}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            <SelectItem value="no-phase">Sem fase</SelectItem>
            {phases?.map((phase) => (
              <SelectItem key={phase.id} value={phase.id.toString()}>
                {phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedCategory !== "all" || selectedPhase !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedPhase("all");
            }}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Documents grouped by phase */}
      <div className="space-y-6">
        {Object.keys(groupedDocuments).length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="font-serif text-xl text-gray-600 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory !== "all" || selectedPhase !== "all"
                ? "Tente ajustar os filtros ou envie um novo documento."
                : "Comece enviando o primeiro documento administrativo do projeto."}
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-[#C9A882] hover:bg-[#B8976F] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Primeiro Documento
            </Button>
          </Card>
        ) : (
          Object.entries(groupedDocuments).map(([phaseKey, docs]) => {
            const phaseId = phaseKey === "no-phase" ? null : parseInt(phaseKey.replace("phase-", ""));
            const phaseInfo = getPhaseInfo(phaseId);

            return (
              <div key={phaseKey} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  {phaseId ? <FolderOpen className="w-5 h-5 text-[#C9A882]" /> : <Folder className="w-5 h-5 text-gray-400" />}
                  <h4 className={`font-serif text-lg ${phaseInfo.color}`}>
                    {phaseInfo.name}
                  </h4>
                  <Badge variant="outline" className="ml-auto">
                    {docs.length} documento{docs.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => {
                    const categoryInfo = getCategoryInfo(doc.category);
                    const CategoryIcon = categoryInfo.icon;

                    return (
                      <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        </div>

                        <h5 className="font-medium text-gray-900 mb-1 line-clamp-1">
                          {doc.name}
                        </h5>
                        
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        <div className="text-xs text-gray-500 mb-3">
                          {new Date(doc.createdAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(0)} KB`}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewDoc(doc)}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Baixar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
                {previewDoc.name}
              </DialogTitle>
              <DialogDescription>
                {getCategoryInfo(previewDoc.category).label} • {new Date(previewDoc.createdAt).toLocaleDateString("pt-PT")}
              </DialogDescription>
            </DialogHeader>

            <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
              {previewDoc.fileType?.startsWith("image/") ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={previewDoc.fileUrl}
                  className="w-full h-full"
                  title={previewDoc.name}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => window.open(previewDoc.fileUrl, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Documento
              </Button>
              <Button onClick={() => setPreviewDoc(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
