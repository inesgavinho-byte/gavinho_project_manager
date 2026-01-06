import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Clock, LogIn, LogOut, Package, Camera, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function SiteMobile() {
  const { toast } = useToast();
  const [selectedConstruction, setSelectedConstruction] = useState<number | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"attendance" | "materials" | "photos">("attendance");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get constructions list
  const { data: constructions } = trpc.constructions.list.useQuery();

  // Get workers for selected construction
  const { data: workers } = trpc.siteManagement.workers.list.useQuery(
    { constructionId: selectedConstruction!, activeOnly: true },
    { enabled: !!selectedConstruction }
  );

  // Get active attendance
  const { data: activeAttendance, refetch: refetchAttendance } = trpc.siteManagement.attendance.getActive.useQuery(
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
      refetchAttendance();
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
      refetchAttendance();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create material request mutation
  const createRequest = trpc.siteManagement.materialRequests.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Requisição criada",
        description: "A requisição foi registada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload photo mutation
  const uploadPhoto = trpc.siteManagement.workPhotos.upload.useMutation({
    onSuccess: () => {
      toast({
        title: "Foto enviada",
        description: "A fotografia foi carregada com sucesso.",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setLocation(null);
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

  const handleMaterialRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedConstruction) {
      toast({
        title: "Erro",
        description: "Selecione uma obra primeiro",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    createRequest.mutate({
      constructionId: selectedConstruction,
      materialName: formData.get("materialName") as string,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      urgency: formData.get("urgency") as "low" | "medium" | "high" | "urgent",
      reason: formData.get("reason") as string || undefined,
    });

    // Reset form
    (e.target as HTMLFormElement).reset();
  };

  const calculateDuration = (checkIn: Date) => {
    const end = new Date();
    const start = new Date(checkIn);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4">
          <h1 className="font-serif text-2xl font-light tracking-tight text-center">
            GAVINHO Obra
          </h1>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Selection Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Selecionar Obra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Obra</Label>
              <Select
                value={selectedConstruction?.toString()}
                onValueChange={(value) => {
                  setSelectedConstruction(parseInt(value));
                  setSelectedWorker(null);
                }}
              >
                <SelectTrigger className="h-12 text-base">
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
              <Label>Trabalhador</Label>
              <Select
                value={selectedWorker?.toString()}
                onValueChange={(value) => setSelectedWorker(parseInt(value))}
                disabled={!selectedConstruction}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione seu nome" />
                </SelectTrigger>
                <SelectContent>
                  {workers?.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id.toString()}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedWorker && selectedConstruction && (
          <>
            {/* Tab Navigation */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={activeTab === "attendance" ? "default" : "outline"}
                onClick={() => setActiveTab("attendance")}
                className="h-14 flex-col gap-1"
              >
                <Clock className="h-5 w-5" />
                <span className="text-xs">Ponto</span>
              </Button>
              <Button
                variant={activeTab === "materials" ? "default" : "outline"}
                onClick={() => setActiveTab("materials")}
                className="h-14 flex-col gap-1"
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Materiais</span>
              </Button>
              <Button
                variant={activeTab === "photos" ? "default" : "outline"}
                onClick={() => setActiveTab("photos")}
                className="h-14 flex-col gap-1"
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs">Fotos</span>
              </Button>
            </div>

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Picagem de Ponto</CardTitle>
                  <CardDescription>
                    Registe entrada e saída de obra
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeAttendance ? (
                    <>
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <Clock className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Em obra desde</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(activeAttendance.checkIn), "HH:mm", { locale: pt })}
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-center py-4">
                          {calculateDuration(activeAttendance.checkIn)}
                        </div>
                      </div>
                      <Button
                        onClick={handleCheckOut}
                        disabled={checkOut.isPending}
                        variant="destructive"
                        size="lg"
                        className="w-full h-14 text-lg gap-2"
                      >
                        <LogOut className="h-5 w-5" />
                        Check-out
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleCheckIn}
                      disabled={checkIn.isPending}
                      size="lg"
                      className="w-full h-14 text-lg gap-2"
                    >
                      <LogIn className="h-5 w-5" />
                      Check-in
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Materials Tab */}
            {activeTab === "materials" && (
              <Card>
                <CardHeader>
                  <CardTitle>Requisitar Material</CardTitle>
                  <CardDescription>
                    Solicite materiais necessários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMaterialRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="materialName">Material *</Label>
                      <Input
                        id="materialName"
                        name="materialName"
                        placeholder="Ex: Cimento Portland"
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          step="0.01"
                          placeholder="100"
                          className="h-12 text-base"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Unidade *</Label>
                        <Input
                          id="unit"
                          name="unit"
                          placeholder="kg, m³, un"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgência *</Label>
                      <Select name="urgency" required>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Selecione a urgência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo</Label>
                      <Textarea
                        id="reason"
                        name="reason"
                        placeholder="Descreva o motivo..."
                        rows={3}
                        className="text-base"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createRequest.isPending}
                      size="lg"
                      className="w-full h-14 text-lg"
                    >
                      {createRequest.isPending ? "A enviar..." : "Enviar Requisição"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Photos Tab */}
            {activeTab === "photos" && (
              <Card>
                <CardHeader>
                  <CardTitle>Fotografias de Obra</CardTitle>
                  <CardDescription>
                    Registe trabalhos executados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photoPreview ? (
                    <>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {location && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                          <p className="font-medium text-green-700">Localização capturada</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!photoFile || !selectedWorker || !selectedConstruction) return;

                        const formData = new FormData(e.currentTarget);
                        const description = formData.get("description") as string;
                        const locationName = formData.get("location") as string;

                        // Convert file to base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          uploadPhoto.mutate({
                            constructionId: selectedConstruction,
                            workerId: selectedWorker,
                            photoData: base64,
                            description: description || undefined,
                            location: locationName || undefined,
                            latitude: location?.latitude,
                            longitude: location?.longitude,
                          });
                        };
                        reader.readAsDataURL(photoFile);
                      }} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Localização na Obra</Label>
                          <Input
                            id="location"
                            name="location"
                            placeholder="Ex: Piso 2, Sala A"
                            className="h-12 text-base"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            name="description"
                            placeholder="Descreva o trabalho executado..."
                            rows={3}
                            className="text-base"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                              setLocation(null);
                            }}
                            className="flex-1 h-12"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={uploadPhoto.isPending}
                            className="flex-1 h-12"
                          >
                            {uploadPhoto.isPending ? "A enviar..." : "Enviar Foto"}
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPhotoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);

                            // Get geolocation
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  setLocation({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                  });
                                },
                                (error) => {
                                  console.error("Geolocation error:", error);
                                  toast({
                                    title: "Aviso",
                                    description: "Não foi possível obter a localização.",
                                    variant: "destructive",
                                  });
                                }
                              );
                            }
                          }
                        }}
                      />

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        size="lg"
                        className="w-full h-32 flex-col gap-3 text-lg"
                      >
                        <Camera className="h-12 w-12" />
                        Tirar Fotografia
                      </Button>

                      <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                        <p className="text-sm text-muted-foreground text-center">
                          A localização GPS será capturada automaticamente
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Card */}
        {!selectedWorker && (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Como usar</p>
                  <p className="text-sm text-muted-foreground">
                    Selecione a obra e o seu nome para começar a registar ponto e requisitar materiais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
