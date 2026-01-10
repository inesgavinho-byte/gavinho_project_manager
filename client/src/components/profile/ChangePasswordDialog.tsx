import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const changePasswordMutation = trpc.userProfile.changePassword.useMutation({
    onSuccess: () => {
      toast({
        title: "Password alterada",
        description: "A sua password foi alterada com sucesso.",
      });
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Password atual é obrigatória";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Nova password é obrigatória";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmação de password é obrigatória";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "As passwords não correspondem";
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = "A nova password não pode ser igual à atual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Password</DialogTitle>
          <DialogDescription>
            Atualize a sua password para manter a sua conta segura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              A sua password deve ter pelo menos 6 caracteres e ser diferente da atual.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="oldPassword">Password Atual *</Label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Introduza a sua password atual"
              className={errors.oldPassword ? "border-red-500" : ""}
            />
            {errors.oldPassword && (
              <p className="text-sm text-red-500">{errors.oldPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Password *</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Introduza a nova password"
              className={errors.newPassword ? "border-red-500" : ""}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirme a nova password"
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changePasswordMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brown hover:bg-brown/90"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Alterar Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
