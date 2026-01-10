import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface ContractUploadProps {
  projectId: number;
  onUploadComplete?: () => void;
}

export function ContractUpload({ projectId, onUploadComplete }: ContractUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();
  
  const uploadAndExtractMutation = trpc.projects.contract.uploadAndExtract.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Contrato processado com sucesso!",
        description: `Cliente ${data.result.clientCreated ? 'criado' : 'atualizado'}, ${data.result.phasesCreated} fases e ${data.result.deliverablesCreated} entregáveis adicionados.`,
      });
      setUploadedFile(data.fileUrl);
      setExtracting(false);
      setUploading(false);
      onUploadComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar contrato",
        description: error.message,
        variant: "destructive",
      });
      setExtracting(false);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 16MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setExtracting(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:application/pdf;base64, prefix

        // Upload and extract
        await uploadAndExtractMutation.mutateAsync({
          projectId,
          fileData: base64Data,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setUploading(false);
      setExtracting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Upload de Contrato</h3>
        </div>

        <div className="text-sm text-muted-foreground">
          Faça upload do contrato assinado em PDF. Os dados serão extraídos automaticamente e o projeto será atualizado com:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Dados do cliente (nome, NIF, morada)</li>
            <li>Valor contratual e condições de pagamento</li>
            <li>Fases do projeto e entregáveis</li>
            <li>Prazos e condições contratuais</li>
          </ul>
        </div>

        {!uploading && !uploadedFile && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="contract-upload"
            />
            <label
              htmlFor="contract-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-sm font-medium">
                Clique para selecionar o contrato em PDF
              </div>
              <div className="text-xs text-muted-foreground">
                Tamanho máximo: 16MB
              </div>
            </label>
          </div>
        )}

        {uploading && (
          <div className="border border-muted rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <div className="font-medium">
                  {extracting ? "A extrair dados do contrato..." : "A fazer upload..."}
                </div>
                <div className="text-sm text-muted-foreground">
                  {extracting 
                    ? "A processar o PDF e extrair informações. Isto pode demorar alguns segundos."
                    : "A enviar o arquivo para o servidor."}
                </div>
              </div>
            </div>

            {extracting && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Leitura do PDF
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Extração de dados com IA
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Atualização do projeto
                </div>
              </div>
            )}
          </div>
        )}

        {uploadedFile && (
          <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-green-900 dark:text-green-100">
                  Contrato processado com sucesso!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Os dados foram extraídos e aplicados ao projeto. Verifique as informações nos separadores Contrato e Financeiro.
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(uploadedFile, "_blank")}
                    className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Contrato
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
