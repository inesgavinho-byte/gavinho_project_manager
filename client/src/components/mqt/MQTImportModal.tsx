import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import {
  parseExcelFile,
  importFromGoogleSheets,
  type ImportResult,
  type MQTImportRow,
  type ImportValidationError,
} from '@/lib/mqtImportService';
import { trpc } from '@/lib/trpc';

interface MQTImportModalProps {
  open: boolean;
  onClose: () => void;
  constructionId: number;
}

export function MQTImportModal({ open, onClose, constructionId }: MQTImportModalProps) {
  const [importType, setImportType] = useState<'excel' | 'sheets'>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const importMutation = trpc.mqt.importItems.useMutation();
  const utils = trpc.useUtils();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setShowPreview(false);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await parseExcelFile(file);
      setImportResult(result);
      setShowPreview(true);
    } catch (error) {
      alert(`Erro ao processar arquivo: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessSheets = async () => {
    if (!sheetsUrl) return;

    setIsProcessing(true);
    try {
      const result = await importFromGoogleSheets(sheetsUrl);
      setImportResult(result);
      setShowPreview(true);
    } catch (error) {
      alert(`Erro ao importar Google Sheets: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || importResult.summary.errors > 0) {
      alert('Corrija os erros antes de importar');
      return;
    }

    setIsProcessing(true);
    try {
      await importMutation.mutateAsync({
        constructionId,
        items: importResult.data,
      });

      utils.mqt.getItems.invalidate({ constructionId });
      alert(`${importResult.summary.valid} itens importados com sucesso!`);
      handleClose();
    } catch (error) {
      alert(`Erro ao importar: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSheetsUrl('');
    setImportResult(null);
    setShowPreview(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C5A572]" />
            Importar MQT
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <Tabs value={importType} onValueChange={(v) => setImportType(v as 'excel' | 'sheets')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel">Excel (.xlsx, .xls)</TabsTrigger>
              <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            </TabsList>

            <TabsContent value="excel" className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o arquivo Excel</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleProcessFile}
                    disabled={!file || isProcessing}
                    className="bg-[#C5A572] hover:bg-[#B39562]"
                  >
                    {isProcessing ? 'Processando...' : 'Processar'}
                  </Button>
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato esperado:</strong> A primeira linha deve conter os cabeçalhos das colunas.
                  Colunas obrigatórias: Código, Categoria, Descrição, Unidade, Quantidade.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="sheets" className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Google Sheets</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleProcessSheets}
                    disabled={!sheetsUrl || isProcessing}
                    className="bg-[#C5A572] hover:bg-[#B39562]"
                  >
                    {isProcessing ? 'Processando...' : 'Importar'}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> A planilha deve estar publicada ou com acesso público.
                  Vá em Arquivo → Compartilhar → Publicar na Web.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult?.summary.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total de linhas</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult?.summary.valid || 0}</div>
                <div className="text-sm text-muted-foreground">Válidas</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult?.summary.errors || 0}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult?.summary.warnings || 0}</div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
            </div>

            {/* Errors */}
            {importResult && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Erros encontrados
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        <strong>Linha {error.row}:</strong> {error.message} ({error.field})
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {importResult && importResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Avisos
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.warnings.slice(0, 10).map((warning, index) => (
                    <Alert key={index} className="py-2 bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                      <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Linha {warning.row}:</strong> {warning.message} ({warning.field})
                      </AlertDescription>
                    </Alert>
                  ))}
                  {importResult.warnings.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      ... e mais {importResult.warnings.length - 10} avisos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {importResult && importResult.data.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Preview dos dados (primeiros 5 itens)
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Código</th>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-left">Unidade</th>
                        <th className="p-2 text-right">Quantidade</th>
                        <th className="p-2 text-right">Preço Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.data.slice(0, 5).map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.code}</td>
                          <td className="p-2">{item.category}</td>
                          <td className="p-2 max-w-xs truncate">{item.description}</td>
                          <td className="p-2">{item.unit}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">
                            {item.unitPrice ? `€${item.unitPrice.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={isProcessing || (importResult?.summary.errors || 0) > 0}
                  className="bg-[#C5A572] hover:bg-[#B39562]"
                >
                  {isProcessing ? 'Importando...' : `Importar ${importResult?.summary.valid || 0} itens`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
