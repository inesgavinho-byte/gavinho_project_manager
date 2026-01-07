import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat, Users, Clock, Package, Camera, AlertTriangle, ClipboardList, BarChart3, Target } from "lucide-react";
import { Link } from "wouter";

export default function SiteManagement() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-light tracking-tight mb-2">
          Gestão de Obra
        </h1>
        <p className="text-muted-foreground">
          Sistema completo para gestão de operações em obra
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="workers">Trabalhadores</TabsTrigger>
          <TabsTrigger value="attendance">Picagem de Ponto</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="photos">Fotografias</TabsTrigger>
          <TabsTrigger value="compliance">Não Conformidades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/site-management/workers">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Trabalhadores</CardTitle>
                      <CardDescription>Gestão de equipa em obra</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cadastro e gestão de trabalhadores, funções e contactos
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/site-management/attendance">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Picagem de Ponto</CardTitle>
                      <CardDescription>Controlo de presenças</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Registo de entrada/saída e horas trabalhadas
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/site-management/materials">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Package className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Materiais</CardTitle>
                      <CardDescription>Requisição e consumo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestão de requisições e registo de consumos
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/site-management/photos">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Fotografias</CardTitle>
                      <CardDescription>Registo visual de obra</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload e organização de fotografias diárias
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/site-management/compliance">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <CardTitle>Não Conformidades</CardTitle>
                      <CardDescription>Gestão de ocorrências</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Registo e acompanhamento de não conformidades
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/constructions">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow border-[#C9A882]/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#C9A882]/10">
                      <ClipboardList className="h-6 w-6 text-[#C9A882]" />
                    </div>
                    <div>
                      <CardTitle>Mapa de Quantidades</CardTitle>
                      <CardDescription>Controlo de progresso MQT</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Marcação de quantidades executadas e visualização de progresso
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/site-management/1/productivity-goals">
              <Card className="cursor-pointer hover:shadow-gavinho transition-shadow border-green-500/30">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Metas de Produtividade</CardTitle>
                      <CardDescription>Configurar e monitorar metas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Defina metas diárias e receba alertas automáticos de desempenho
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <HardHat className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Mais Funcionalidades</CardTitle>
                    <CardDescription>Em desenvolvimento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Subempreiteiros, Segurança, Mapa de Quantidades
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workers">
          <Card>
            <CardHeader>
              <CardTitle>Trabalhadores em Obra</CardTitle>
              <CardDescription>
                Gestão de trabalhadores será implementada aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Picagem de Ponto</CardTitle>
              <CardDescription>
                Sistema de controlo de presenças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Materiais</CardTitle>
              <CardDescription>
                Requisições e consumos de materiais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Fotografias de Obra</CardTitle>
              <CardDescription>
                Registo visual do progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Não Conformidades</CardTitle>
              <CardDescription>
                Gestão de ocorrências e não conformidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
