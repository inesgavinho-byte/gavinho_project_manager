import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

export function RequestAbsenceForm() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<string>("");
  const [reason, setReason] = useState("");
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const createAbsenceMutation = trpc.hr.absences.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Pedido enviado",
        description: "O seu pedido de ausência foi submetido para aprovação.",
      });
      setOpen(false);
      setStartDate("");
      setEndDate("");
      setType("");
      setReason("");
      utils.hr.absences.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o pedido.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !type) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      toast({
        title: "Datas inválidas",
        description: "A data de início deve ser anterior à data de fim.",
        variant: "destructive",
      });
      return;
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast({
        title: "Data inválida",
        description: "Não é possível solicitar ausências para datas passadas.",
        variant: "destructive",
      });
      return;
    }

    createAbsenceMutation.mutate({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      type: type as "vacation" | "sick" | "personal" | "other",
      reason: reason || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          Solicitar Ausência
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Solicitar Ausência</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do seu pedido de ausência. O pedido será enviado para aprovação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Ausência *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Férias</SelectItem>
                  <SelectItem value="sick">Doença</SelectItem>
                  <SelectItem value="personal">Assunto Pessoal</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo / Observações</Label>
              <Textarea
                id="reason"
                placeholder="Adicione detalhes sobre o pedido (opcional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createAbsenceMutation.isPending}>
              {createAbsenceMutation.isPending ? "A enviar..." : "Enviar Pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
