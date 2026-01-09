import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function TeamManagement() {
  const { toast } = useToast();
  const [startDate] = useState<Date>(new Date(new Date().setDate(1)));
  const [endDate] = useState<Date>(new Date());
  const [timeDescription, setTimeDescription] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeDate] = useState<Date>(new Date());
  const [availabilityDate] = useState<Date>(new Date());
  const [availabilityStatus, setAvailabilityStatus] = useState<"available" | "busy" | "off" | "vacation">("available");
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const { data: assignments, isLoading: assignmentsLoading } = trpc.teamManagement.getMyAssignments.useQuery();
  const { data: timeSummary } = trpc.teamManagement.getTimeSummary.useQuery({ startDate, endDate });

  const logTimeMutation = trpc.teamManagement.logTime.useMutation({
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Horas registadas" });
      setTimeDescription("");
      setTimeHours("");
    },
  });

  const setAvailabilityMutation = trpc.teamManagement.setAvailability.useMutation({
    onSuccess: () => toast({ title: "Sucesso", description: "Disponibilidade atualizada" }),
  });

  const handleLogTime = () => {
    const hours = parseFloat(timeHours);
    if (!timeDescription || isNaN(hours)) return;
    logTimeMutation.mutate({ description: timeDescription, hours, date: timeDate });
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Equipa</h1>
        <p className="text-muted-foreground">Tracking de horas, tarefas e disponibilidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total de Horas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{timeSummary?.totalHours || 0}h</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Dias Trabalhados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{timeSummary?.daysWorked || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Tarefas Concluídas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{timeSummary?.tasksCompleted || 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="time">Horas</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader><CardTitle>Minhas Tarefas</CardTitle></CardHeader>
            <CardContent>
              {assignmentsLoading ? <div>A carregar...</div> : 
               assignments && assignments.length > 0 ? (
                <div className="space-y-2">
                  {assignments.map(task => (
                    <div key={task.id} className="p-4 border rounded">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.projectName}</p>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-muted-foreground">Sem tarefas</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader><CardTitle>Registar Horas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Descrição</Label><Textarea value={timeDescription} onChange={(e) => setTimeDescription(e.target.value)} /></div>
              <div><Label>Horas</Label><Input type="number" step="0.5" value={timeHours} onChange={(e) => setTimeHours(e.target.value)} /></div>
              <Button onClick={handleLogTime}>Registar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader><CardTitle>Disponibilidade</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Estado</Label>
                <Select value={availabilityStatus} onValueChange={(v: any) => setAvailabilityStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                    <SelectItem value="off">Folga</SelectItem>
                    <SelectItem value="vacation">Férias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setAvailabilityMutation.mutate({ date: availabilityDate, status: availabilityStatus, notes: availabilityNotes })}>
                Guardar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
