import { useState } from 'react';
import { Upload, Link as LinkIcon, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';

interface MQTUploadProps {
  projectId: number;
  onSuccess?: () => void;
}

export function MQTUpload({ projectId, onSuccess }: MQTUploadProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const importFromSheets = trpc.mq.importFromGoogleSheets.useMutation();
  const importFromExcel = trpc.mq.importFromExcel.useMutation();

  const handleGoogleSheetsImport = async () => {
    if (!sheetUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid Google Sheets URL' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await importFromSheets.mutateAsync({
        projectId,
        sheetUrl,
      });

      setMessage({
        type: 'success',
        text: `Successfully imported ${result.data.successRows} items. ${result.data.alerts.length} alerts generated.`,
      });
      setSheetUrl('');
      onSuccess?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      const result = await importFromExcel.mutateAsync({
        projectId,
        fileName: file.name,
        fileData: base64,
      });

      setMessage({
        type: 'success',
        text: `Successfully imported ${result.data.successRows} items. ${result.data.alerts.length} alerts generated.`,
      });
      onSuccess?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import MQT Data</CardTitle>
        <CardDescription>Upload quantity maps from Google Sheets or Excel</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sheets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            <TabsTrigger value="excel">Excel File</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Sheets URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleGoogleSheetsImport}
                  disabled={isLoading || !sheetUrl.trim()}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share the spreadsheet with: gavinho-mqt-service@gavinho-mqt.iam.gserviceaccount.com
              </p>
            </div>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Excel File (.xlsx)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Excel files (.xlsx)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Columns: itemCode, itemDescription, plannedQuantity, executedQuantity, unit
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert className={`mt-4 ${message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
