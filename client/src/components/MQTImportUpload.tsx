import React, { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface MQTImportUploadProps {
  projectId: number;
  onImportSuccess?: () => void;
}

export function MQTImportUpload({ projectId, onImportSuccess }: MQTImportUploadProps) {
  const [activeTab, setActiveTab] = useState<"sheets" | "excel">("sheets");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importFromSheetsMutation = trpc.mqt.importFromGoogleSheets.useMutation();
  const importFromExcelMutation = trpc.mqt.importFromExcel.useMutation();

  const handleSheetsImport = async () => {
    if (!sheetsUrl.trim()) {
      setMessage({ type: "error", text: "Por favor, insira a URL do Google Sheets" });
      return;
    }

    setLoading(true);
    try {
      const result = await importFromSheetsMutation.mutateAsync({
        projectId,
        sheetUrl: sheetsUrl,
      });

      setMessage({
        type: "success",
        text: `Importação bem-sucedida! ${result.data.processedRows} linhas processadas.`,
      });
      setSheetsUrl("");
      onImportSuccess?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      setMessage({ type: "error", text: "Por favor, selecione um arquivo Excel" });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Parse Excel file (simplified - assumes CSV format for now)
          const text = e.target?.result as string;
          const lines = text.split("\n");
          const jsonData = [];

          // Skip header
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
            if (parts.length >= 4) {
              jsonData.push({
                itemCode: parts[0],
                itemDescription: parts[1] || undefined,
                plannedQuantity: parseFloat(parts[2]),
                executedQuantity: parseFloat(parts[3]),
                unit: parts[4] || undefined,
              });
            }
          }

          const result = await importFromExcelMutation.mutateAsync({
            projectId,
            jsonData,
            fileName: excelFile.name,
          });

          setMessage({
            type: "success",
            text: `Importação bem-sucedida! ${result.data.processedRows} linhas processadas.`,
          });
          setExcelFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          onImportSuccess?.();
        } catch (error) {
          setMessage({
            type: "error",
            text: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(excelFile);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro na importação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setMessage(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Mapa de Quantidades
        </CardTitle>
        <CardDescription>
          Importe dados de quantidades a partir de Google Sheets ou Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sheets" | "excel")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            <TabsTrigger value="excel">Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Google Sheets</label>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Copie o link do seu Google Sheets compartilhado. A planilha deve ter as colunas:
                Código, Descrição, Quantidade Planejada, Quantidade Executada, Unidade
              </p>
            </div>
            <Button
              onClick={handleSheetsImport}
              disabled={loading || !sheetsUrl.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar do Google Sheets
            </Button>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo Excel</label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {excelFile ? excelFile.name : "Selecionar arquivo"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos suportados: .xlsx, .xls, .csv. Máximo 10MB.
              </p>
            </div>
            <Button
              onClick={handleExcelImport}
              disabled={loading || !excelFile}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar do Excel
            </Button>
          </TabsContent>
        </Tabs>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Formato esperado:</h4>
          <div className="text-xs space-y-1 font-mono">
            <div>Código | Descrição | Planejado | Executado | Unidade</div>
            <div className="text-muted-foreground">
              <div>MAT-001 | Cimento | 100 | 95 | sacos</div>
              <div>MAT-002 | Areia | 50 | 52 | m³</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
