import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Download, Eye, Filter, X, Trash2 } from "lucide-react";

interface ProjectDocumentsProps {
  projectId: number;
}

const DOCUMENT_CATEGORIES = [
  { value: "contract", label: "Contratos" },
  { value: "plan", label: "Plantas" },
  { value: "license", label: "Licenças" },
  { value: "invoice", label: "Faturas" },
  { value: "other", label: "Outros" },
];

export default function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    category: "contract" as const,
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, refetch: refetchDocuments } = trpc.projects.documents.list.useQuery({ projectId });

  const uploadDocument = trpc.projects.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso!");
      setIsUploadOpen(false);
      setUploadData({ name: "", description: "", category: "contract", file: null });
      refetchDocuments();
    },
    onError: (error) => {
      toast.error("Erro ao enviar documento: " + error.message);
    },
  });

  const deleteDocument = trpc.projects.documents.delete.useMutation({
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

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10MB)");
      return;
    }

    setUploadData({ ...uploadData, file, name: uploadData.name || file.name.replace(".pdf", "") });
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
        name: uploadData.name,
        description: uploadData.description,
        category: uploadData.category,
        fileData: base64.split(",")[1], // Remove data:application/pdf;base64, prefix
        fileType: uploadData.file!.type,
        fileSize: uploadData.file!.size,
      });
    };
    reader.readAsDataURL(uploadData.file);
  };

  const getCategoryLabel = (category: string) => {
    return DOCUMENT_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      contract: "bg-blue-50 text-blue-700 border-blue-200",
      plan: "bg-purple-50 text-purple-700 border-purple-200",
      license: "bg-emerald-50 text-emerald-700 border-emerald-200",
      invoice: "bg-orange-50 text-orange-700 border-orange-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[category] || colors.other;
  };

  const filteredDocuments = documents?.filter((doc) => 
    selectedCategory === "all" || doc.category === selectedCategory
  );

  return (
    <Card className="p-6 border-[#C3BAAF]/20 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="font-serif text-2xl text-[#5F5C59]">Documentos do Projeto</h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] border-[#C3BAAF]/20">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Enviar Documento</DialogTitle>
              <DialogDescription className="text-[#5F5C59]/60">
                Envie um documento PDF para o projeto (máximo 10MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name" className="text-[#5F5C59]">Nome do Documento *</Label>
                <Input
                  id="doc-name"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="Contrato de Empreitada"
                  className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-desc" className="text-[#5F5C59]">Descrição</Label>
                <Input
                  id="doc-desc"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Descrição opcional"
                  className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-category" className="text-[#5F5C59]">Categoria *</Label>
                <Select value={uploadData.category} onValueChange={(value: any) => setUploadData({ ...uploadData, category: value })}>
                  <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file" className="text-[#5F5C59]">Arquivo PDF *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-[#C3BAAF]/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadData.file ? uploadData.file.name : "Selecionar Arquivo PDF"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                className="border-[#C3BAAF]/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadDocument.isPending}
                className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
              >
                {uploadDocument.isPending ? "A enviar..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 border-[#C3BAAF]/20 bg-white hover:border-[#C9A882]/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#C9A882]" />
                    <h4 className="font-medium text-[#5F5C59] truncate">{doc.name}</h4>
                  </div>
                  <Badge className={`${getCategoryColor(doc.category)} border text-xs mb-2`}>
                    {getCategoryLabel(doc.category)}
                  </Badge>
                  {doc.description && (
                    <p className="text-sm text-[#5F5C59]/60 line-clamp-2">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#C3BAAF]/10">
                <span className="text-xs text-[#5F5C59]/60">
                  {new Date(doc.uploadedAt).toLocaleDateString('pt-PT')}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-[#C9A882] hover:text-[#C9A882] hover:bg-[#C9A882]/10 h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                    className="text-[#C9A882] hover:text-[#C9A882] hover:bg-[#C9A882]/10 h-8 w-8 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja remover ${doc.name}?`)) {
                        deleteDocument.mutate({ id: doc.id });
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#EEEAE5] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#C9A882]" />
          </div>
          <h4 className="font-serif text-xl text-[#5F5C59] mb-2">Nenhum documento</h4>
          <p className="text-[#5F5C59]/60 mb-4">
            {selectedCategory === "all" 
              ? "Comece por enviar documentos para o projeto" 
              : "Nenhum documento nesta categoria"}
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Enviar Primeiro Documento
          </Button>
        </div>
      )}

      {/* PDF Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#5F5C59]">{previewDoc.name}</DialogTitle>
              <DialogDescription className="text-[#5F5C59]/60">
                {getCategoryLabel(previewDoc.category)} • {new Date(previewDoc.uploadedAt).toLocaleDateString('pt-PT')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewDoc.fileUrl}
                className="w-full h-full border border-[#C3BAAF]/20 rounded"
                title={previewDoc.name}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                className="border-[#C3BAAF]/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => setPreviewDoc(null)}
                className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
