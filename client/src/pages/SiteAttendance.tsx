import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function SiteAttendance() {
  const { toast } = useToast();
  const [selectedConstruction, setSelectedConstruction] = useState<number | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);

  // Get constructions list
  const { data: constructions } = trpc.constructions.list.useQuery();

  // Get workers for selected construction
  const { data: workers } = trpc.siteManagement.workers.list.useQuery(
    { constructionId: selectedConstruction!, activeOnly: true },
    { enabled: !!selectedConstruction }
  );

  // Get attendance records
  const { data: attendanceRecords, refetch } = trpc.siteManagement.attendance.listByConstruction.useQuery(
    { constructionId: selectedConstruction! },
    { enabled: !!selectedConstruction }
  );

  // Get active attendance for selected worker
  const { data: activeAttendance } = trpc.siteManagement.attendance.getActive.useQuery(
    { workerId: selectedWorker!, constructionId: selectedConstruction! },
    { enabled: !!selectedWorker && !!selectedConstruction }
  );

  // Check-in mutation
  const checkIn = trpc.siteManagement.attendance.checkIn.useMutation({
    onSuccess: () => {
      toast({
        title: "Check-in realizado",
        description: "Entrada registada com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOut = trpc.siteManagement.attendance.checkOut.useMutation({
    onSuccess: () => {
      toast({
        title: "Check-out realizado",
        description: "Saída registada com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    if (!selectedWorker || !selectedConstruction) {
      toast({
        title: "Erro",
        description: "Selecione uma obra e um trabalhador",
        variant: "destructive",
      });
      return;
    }

    checkIn.mutate({
      workerId: selectedWorker,
      constructionId: selectedConstruction,
    });
  };

  const handleCheckOut = () => {
    if (!activeAttendance) return;

    checkOut.mutate({
      attendanceId: activeAttendance.id,
    });
  };

  const calculateDuration = (checkIn: Date, checkOut?: Date | null) => {
    const end = checkOut ? new Date(checkOut) : new Date();
    const start = new Date(checkIn);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-light tracking-tight mb-2">
          Picagem de Ponto
        </h1>
        <p className="text-muted-foreground">
          Controlo de presenças e registo de horas
        </p>
      </div>

      <div className="grid gap-6">
        {/* Construction & Worker Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Obra e Trabalhador</CardTitle>
            <CardDescription>
              Escolha a obra e o trabalhador para registar entrada/saída
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Obra</label>
                <Select
                  value={selectedConstruction?.toString()}
                  onValueChange={(value) => {
                    setSelectedConstruction(parseInt(value));
                    setSelectedWorker(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {constructions?.map((construction) => (
                      <SelectItem key={construction.id} value={construction.id.toString()}>
                        {construction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trabalhador</label>
                <Select
                  value={selectedWorker?.toString()}
                  onValueChange={(value) => setSelectedWorker(parseInt(value))}
                  disabled={!selectedConstruction}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um trabalhador" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers?.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id.toString()}>
                        {worker.name} - {worker.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedWorker && (
              <div className="flex items-center gap-4 pt-4 border-t">
                {activeAttendance ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Em obra desde</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activeAttendance.checkIn), "HH:mm", { locale: pt })} 
                          {" • "}
                          {calculateDuration(activeAttendance.checkIn)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCheckOut}
                      disabled={checkOut.isPending}
                      variant="destructive"
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Check-out
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkIn.isPending}
                    className="gap-2 w-full"
                  >
                    <LogIn className="h-4 w-4" />
                    Check-in
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Records */}
        {selectedConstruction && (
          <Card>
            <CardHeader>
              <CardTitle>Registos de Presença</CardTitle>
              <CardDescription>
                Histórico de entradas e saídas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!attendanceRecords || attendanceRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhum registo encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Os registos de presença aparecerão aqui
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trabalhador</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const worker = workers?.find(w => w.id === record.workerId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {worker?.name || `ID: ${record.workerId}`}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.checkIn), "dd/MM/yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.checkIn), "HH:mm", { locale: pt })}
                          </TableCell>
                          <TableCell>
                            {record.checkOut 
                              ? format(new Date(record.checkOut), "HH:mm", { locale: pt })
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {record.checkOut 
                              ? calculateDuration(record.checkIn, record.checkOut)
                              : calculateDuration(record.checkIn)
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.checkOut ? "secondary" : "default"}>
                              {record.checkOut ? "Concluído" : "Em curso"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
