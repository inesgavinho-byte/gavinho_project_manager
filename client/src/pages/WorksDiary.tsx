import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Cloud, Plus, ThermometerSun, Users } from "lucide-react";
import { useState } from "react";
import { ptBR } from "date-fns/locale";

export default function WorksDiary() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWork, setSelectedWork] = useState<string>("");

  const { data: constructions } = trpc.constructions.list.useQuery();

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diário de Obra</h1>
          <p className="text-muted-foreground">
            Registo diário de atividades e condições de obra
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Registo
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar Sidebar */}
        <div className="col-span-4 space-y-4">
          <Card className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md"
            />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Selecionar Obra</h3>
            <Select value={selectedWork} onValueChange={setSelectedWork}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher obra..." />
              </SelectTrigger>
              <SelectContent>
                {constructions?.map(work => (
                  <SelectItem key={work.id} value={work.id.toString()}>
                    {work.code} - {work.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Diary Content */}
        <div className="col-span-8 space-y-4">
          {/* Weather & Conditions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Condições Meteorológicas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tempo</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Ensolarado</SelectItem>
                    <SelectItem value="cloudy">☁️ Nublado</SelectItem>
                    <SelectItem value="rainy">🌧️ Chuvoso</SelectItem>
                    <SelectItem value="stormy">⛈️ Tempestade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Temperatura (°C)</label>
                <div className="flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="25"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Humidade (%)</label>
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="60"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Workers */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Trabalhadores Presentes</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Operários</label>
                <input
                  type="number"
                  placeholder="0"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Encarregados</label>
                <input
                  type="number"
                  placeholder="0"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Activities */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Atividades Realizadas</h3>
            <Textarea
              placeholder="Descrever as atividades realizadas durante o dia..."
              className="min-h-[150px]"
            />
          </Card>

          {/* Observations */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Observações</h3>
            <Textarea
              placeholder="Observações gerais, ocorrências, problemas identificados..."
              className="min-h-[100px]"
            />
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar Registo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
