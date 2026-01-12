import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [loginUrl, setLoginUrl] = useState<string>("");
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch login URL from backend
  useEffect(() => {
    const fetchLoginUrl = async () => {
      try {
        const response = await fetch("/api/oauth/login-url");
        if (!response.ok) {
          throw new Error("Falha ao obter URL de login");
        }
        const data = await response.json();
        setLoginUrl(data.loginUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoadingUrl(false);
      }
    };

    fetchLoginUrl();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      setLocation("/");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">GAVINHO</CardTitle>
          <CardDescription>Design & Build Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Faça login com sua conta Manus para continuar
            </p>
          </div>

          <Button
            onClick={() => {
              if (loginUrl) {
                window.location.href = loginUrl;
              }
            }}
            disabled={loadingUrl || !loginUrl}
            className="w-full"
            size="lg"
          >
            {loadingUrl ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A carregar...
              </>
            ) : (
              "Entrar com Manus"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            onClick={() => {
              // Test login for development
              fetch("/api/test-login", { method: "POST" })
                .then(() => {
                  window.location.href = "/";
                })
                .catch((err) => {
                  setError("Erro no login de teste: " + err.message);
                });
            }}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Login de Teste (Dev)
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao fazer login, você concorda com nossos Termos de Serviço
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
