import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedMaterial {
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  price?: string;
  unit?: string;
  tags?: string;
  imageUrl?: string;
  fileUrl?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMaterial[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: ValidationError[];
  } | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = trpc.library.bulkImportMaterials.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setStep("result");
      if (result.success > 0) {
        toast.success(`${result.success} materiais importados com sucesso!`);
        onImportComplete();
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} materiais falharam na importação`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao importar: " + error.message);
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setErrors([]);
    setParsedData([]);
    setImportResult(null);

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      parseCSV(selectedFile);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      parseExcel(selectedFile);
    } else {
      toast.error("Formato de ficheiro não suportado. Use CSV ou Excel (.xlsx, .xls)");
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const materials = results.data as ParsedMaterial[];
        validateAndSetData(materials);
      },
      error: (error) => {
        toast.error("Erro ao ler CSV: " + error.message);
      },
    });
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ParsedMaterial[];
        validateAndSetData(jsonData);
      } catch (error) {
        toast.error("Erro ao ler Excel: " + (error as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndSetData = (materials: ParsedMaterial[]) => {
    const validationErrors: ValidationError[] = [];

    materials.forEach((material, index) => {
      const rowNum = index + 2; // +2 because row 1 is header

      if (!material.name || material.name.trim() === "") {
        validationErrors.push({
          row: rowNum,
          field: "name",
          message: "Nome é obrigatório",
        });
      }

      if (!material.category || material.category.trim() === "") {
        validationErrors.push({
          row: rowNum,
          field: "category",
          message: "Categoria é obrigatória",
        });
      }

      if (material.price && isNaN(parseFloat(material.price))) {
        validationErrors.push({
          row: rowNum,
          field: "price",
          message: "Preço deve ser um número",
        });
      }
    });

    setErrors(validationErrors);
    setParsedData(materials);
    setStep("preview");
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    importMutation.mutate({ materials: parsedData });
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        name: "Mármore Carrara",
        description: "Mármore branco de alta qualidade",
        category: "Pedra Natural",
        supplier: "Mármores Portugal",
        price: "120.50",
        unit: "m²",
        tags: "mármore,pedra,branco",
        imageUrl: "https://exemplo.com/imagem.jpg",
        fileUrl: "https://exemplo.com/ficha-tecnica.pdf",
      },
      {
        name: "Tinta Acrílica Branca",
        description: "Tinta lavável para interiores",
        category: "Tintas",
        supplier: "CIN",
        price: "45.00",
        unit: "L",
        tags: "tinta,branco,interior",
        imageUrl: "",
        fileUrl: "",
      },
    ];

    // Generate CSV
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_importacao_materiais.csv";
    link.click();

    toast.success("Template descarregado!");
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportResult(null);
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importação em Massa de Materiais
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos materiais de uma só vez usando CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">1. Selecione o ficheiro</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-[#C9A882]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descarregar Template
                </Button>
              </div>

              <Card
                className="border-2 border-dashed border-[#C3BAAF] p-12 text-center cursor-pointer hover:border-[#C9A882] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleFileSelect(selectedFile);
                    }
                  }}
                />
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-[#C3BAAF]" />
                <p className="text-lg font-medium text-[#5F5C59] mb-2">
                  Clique para selecionar ou arraste o ficheiro aqui
                </p>
                <p className="text-sm text-[#C3BAAF]">
                  Formatos suportados: CSV, Excel (.xlsx, .xls)
                </p>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Formato do ficheiro
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  O ficheiro deve conter as seguintes colunas:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>name</strong> (obrigatório) - Nome do material
                  </li>
                  <li>
                    <strong>category</strong> (obrigatório) - Categoria do material
                  </li>
                  <li>
                    <strong>description</strong> (opcional) - Descrição
                  </li>
                  <li>
                    <strong>supplier</strong> (opcional) - Fornecedor
                  </li>
                  <li>
                    <strong>price</strong> (opcional) - Preço
                  </li>
                  <li>
                    <strong>unit</strong> (opcional) - Unidade (m², L, kg, etc.)
                  </li>
                  <li>
                    <strong>tags</strong> (opcional) - Tags separadas por vírgula
                  </li>
                  <li>
                    <strong>imageUrl</strong> (opcional) - URL da imagem
                  </li>
                  <li>
                    <strong>fileUrl</strong> (opcional) - URL da ficha técnica
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">2. Pré-visualização</h3>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Selecionar outro ficheiro
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Linhas</p>
                      <p className="text-2xl font-bold">{parsedData.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Válidas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {parsedData.length - errors.length}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Com Erros</p>
                      <p className="text-2xl font-bold text-red-600">{errors.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <Card className="p-4 border-red-200 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Erros de Validação
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <strong>Linha {error.row}:</strong> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-800 mt-3">
                    Corrija os erros no ficheiro e tente novamente.
                  </p>
                </Card>
              )}

              {/* Preview Table */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Pré-visualização dos Dados</h4>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-[#C3BAAF]/20 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Fornecedor</th>
                        <th className="p-2 text-left">Preço</th>
                        <th className="p-2 text-left">Unidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((material, index) => {
                        const hasError = errors.some((e) => e.row === index + 2);
                        return (
                          <tr
                            key={index}
                            className={hasError ? "bg-red-50" : "hover:bg-[#C3BAAF]/10"}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{material.name}</td>
                            <td className="p-2">{material.category}</td>
                            <td className="p-2">{material.supplier || "-"}</td>
                            <td className="p-2">{material.price ? `${material.price} €` : "-"}</td>
                            <td className="p-2">{material.unit || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {parsedData.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      ... e mais {parsedData.length - 10} linhas
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Result */}
          {step === "result" && importResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Resultado da Importação</h3>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 border-green-200 bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-800">Importados com Sucesso</p>
                      <p className="text-3xl font-bold text-green-900">
                        {importResult.success}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-red-800">Falharam</p>
                      <p className="text-3xl font-bold text-red-900">{importResult.failed}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <Card className="p-4 border-red-200 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-3">Erros de Importação</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <strong>Linha {error.row}:</strong> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReset} className="flex-1">
                  Importar Mais Materiais
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    handleReset();
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>

        {step === "preview" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={errors.length > 0 || importMutation.isPending}
              className="bg-[#C9A882] hover:bg-[#B8976F]"
            >
              {importMutation.isPending ? "A importar..." : `Importar ${parsedData.length} Materiais`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
