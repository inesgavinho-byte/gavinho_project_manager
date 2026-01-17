import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type UserRole = "admin" | "user" | "client";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rotas com base no papel do utilizador
 * Exemplo de uso:
 * <RoleProtectedRoute allowedRoles={["admin"]}>
 *   <AdminPanel />
 * </RoleProtectedRoute>
 */
export function RoleProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: RoleProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Não autenticado</AlertTitle>
        <AlertDescription>
          Precisa de estar autenticado para aceder a esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const userRole = (user.role || "user") as UserRole;

  if (!allowedRoles.includes(userRole)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Não tem permissão para aceder a esta página.
              </p>
              <p className="text-sm">
                Papéis permitidos: <strong>{allowedRoles.join(", ")}</strong>
              </p>
              <p className="text-sm">
                Seu papel: <strong>{userRole}</strong>
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * Hook para verificar se o utilizador tem um papel específico
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();

  if (!user) return false;

  const userRole = (user.role || "user") as UserRole;
  const allowedRoles = Array.isArray(role) ? role : [role];

  return allowedRoles.includes(userRole);
}

/**
 * Hook para verificar se o utilizador é admin
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === "admin";
}

/**
 * Hook para verificar se o utilizador é gestor (admin ou user)
 */
export function useIsManager(): boolean {
  const { user } = useAuth();
  return user?.role === "admin" || user?.role === "user";
}

/**
 * Componente para renderizar conteúdo condicional baseado no papel
 */
interface ConditionalRenderProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ConditionalRender({
  children,
  allowedRoles,
}: ConditionalRenderProps) {
  const hasAccess = useHasRole(allowedRoles);

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Componente para renderizar um botão que fica desabilitado se o utilizador não tem permissão
 */
interface RoleProtectedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  tooltipText?: string;
}

export function RoleProtectedButton({
  allowedRoles,
  children,
  tooltipText,
  disabled,
  ...props
}: RoleProtectedButtonProps) {
  const hasAccess = useHasRole(allowedRoles);
  const { user } = useAuth();

  const isDisabled = !hasAccess || disabled;
  const title = !hasAccess
    ? `Acesso restrito a: ${allowedRoles.join(", ")}`
    : tooltipText;

  return (
    <button {...props} disabled={isDisabled} title={title}>
      {children}
    </button>
  );
}
