import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";

export default function TestLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleTestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao fazer login de teste");
      }

      const data = await response.json();
      console.log("Login bem-sucedido:", data);

      // Aguarde um pouco para o cookie ser definido
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirecione para o dashboard
      setLocation("/");
    } catch (err) {
      console.error("Erro de login:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F0E7] to-[#EEEAE5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-[#C9A882]/20">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#C9A882] rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">G</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-serif text-[#5F5C59]">GAVINHO</CardTitle>
          <CardDescription className="text-[#8B8670]">Design & Build Platform</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-[#5F5C59] text-center">
              Clique abaixo para entrar com a conta de teste (sem OAuth necessário)
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full bg-[#C9A882] hover:bg-[#B89770] text-white h-12 text-base font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A entrar...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar com Teste
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-[#C9A882]/20">
            <p className="text-xs text-[#8B8670] text-center">
              Modo de teste - Apenas para desenvolvimento local
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
