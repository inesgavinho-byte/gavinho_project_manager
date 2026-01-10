import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileUp, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export function ImportContracts() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const importMutation = trpc.import.importContracts.useMutation({
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Importação concluída!",
        description: `${data.imported} projetos importados, ${data.skipped} saltados.`,
      });
      setImporting(false);
    },
    onError: (error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      setImporting(false);
    },
  });

  const handleImport = (dryRun: boolean) => {
    setImporting(true);
    importMutation.mutate({ dryRun });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#5F5C59] mb-2">
            Importar Contratos
          </h1>
          <p className="text-[#8B8670]">
            Importar projetos reais a partir de contratos extraídos (POP.XXX.YYYY)
          </p>
        </div>

        <Card className="border-[#E5E2D9] mb-6">
          <CardHeader>
            <CardTitle className="text-[#5F5C59]">Ficheiro de Dados</CardTitle>
            <CardDescription className="text-[#8B8670]">
              contracts_extracted.json (18 contratos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => handleImport(true)}
                disabled={importing}
                variant="outline"
                className="border-[#E5E2D9]"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Pré-visualizar
              </Button>
              <Button
                onClick={() => handleImport(false)}
                disabled={importing}
                className="bg-[#C9A882] hover:bg-[#B8976F] text-white"
              >
                <FileUp className="w-4 h-4 mr-2" />
                {importing ? "A importar..." : "Importar Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card className="border-[#E5E2D9]">
            <CardHeader>
              <CardTitle className="text-[#5F5C59]">Resultados da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Importados</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {results.imported}
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-900">Saltados</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">
                      {results.skipped}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-900">Erros</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {results.errors.length}
                    </div>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-[#5F5C59] mb-2">Erros:</h3>
                    <ul className="space-y-1">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index} className="text-sm text-red-600">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.projects.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-[#5F5C59] mb-2">
                      Projetos {results.imported > 0 ? "Importados" : "a Importar"}:
                    </h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {results.projects.map((project: any, index: number) => (
                        <div
                          key={index}
                          className="bg-[#F2F0E7] rounded-lg p-3 text-sm"
                        >
                          <div className="font-semibold text-[#5F5C59]">
                            {project.name}
                          </div>
                          <div className="text-[#8B8670] text-xs mt-1">
                            {project.clientName} • {project.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
