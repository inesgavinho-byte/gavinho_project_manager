import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Search, UserPlus, Phone, Mail, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SiteWorkers() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConstruction, setSelectedConstruction] = useState<number | null>(null);

  // Get constructions list
  const { data: constructions } = trpc.constructions.list.useQuery();

  // Get workers for selected construction
  const { data: workers, refetch } = trpc.siteManagement.workers.list.useQuery(
    { constructionId: selectedConstruction!, activeOnly: false },
    { enabled: !!selectedConstruction }
  );

  // Create worker mutation
  const createWorker = trpc.siteManagement.workers.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Trabalhador criado",
        description: "O trabalhador foi adicionado com sucesso.",
      });
      setIsDialogOpen(false);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    createWorker.mutate({
      constructionId: selectedConstruction,
      name: formData.get("name") as string,
      role: formData.get("role") as "worker" | "foreman" | "technician" | "engineer",
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      company: formData.get("company") as string || undefined,
    });
  };

  const filteredWorkers = workers?.filter((worker) =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const variants = {
      worker: "default",
      foreman: "secondary",
      technician: "outline",
      engineer: "default",
    } as const;
    
    const labels = {
      worker: "Trabalhador",
      foreman: "Encarregado",
      technician: "Técnico",
      engineer: "Engenheiro",
    };

    return (
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-light tracking-tight mb-2">
          Gestão de Trabalhadores
        </h1>
        <p className="text-muted-foreground">
          Cadastro e gestão de trabalhadores em obra
        </p>
      </div>

      <div className="grid gap-6">
        {/* Construction Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Obra</CardTitle>
            <CardDescription>
              Escolha a obra para visualizar e gerir trabalhadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedConstruction?.toString()}
              onValueChange={(value) => setSelectedConstruction(parseInt(value))}
            >
              <SelectTrigger className="w-full">
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
          </CardContent>
        </Card>

        {selectedConstruction && (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar trabalhadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Trabalhador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Trabalhador</DialogTitle>
                    <DialogDescription>
                      Adicione um novo trabalhador à obra
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="João Silva"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Função *</Label>
                      <Select name="role" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">Trabalhador</SelectItem>
                          <SelectItem value="foreman">Encarregado</SelectItem>
                          <SelectItem value="technician">Técnico</SelectItem>
                          <SelectItem value="engineer">Engenheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+351 912 345 678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="joao.silva@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createWorker.isPending}>
                        {createWorker.isPending ? "A criar..." : "Criar Trabalhador"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Workers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Trabalhadores</CardTitle>
                <CardDescription>
                  {filteredWorkers?.length || 0} trabalhador(es) registado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!filteredWorkers || filteredWorkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Nenhum trabalhador registado
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione trabalhadores para começar a gerir a equipa em obra
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkers.map((worker) => (
                        <TableRow key={worker.id}>
                          <TableCell className="font-medium">{worker.name}</TableCell>
                          <TableCell>{getRoleBadge(worker.role)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              {worker.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {worker.phone}
                                </div>
                              )}
                              {worker.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {worker.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {worker.company && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {worker.company}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={worker.isActive ? "default" : "secondary"}>
                              {worker.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
