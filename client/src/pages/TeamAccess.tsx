import { Shield, Users, Key, Sparkles, CheckCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TeamAccess() {
  const teamMembers = [
    { name: "Armando Felix", email: "armando.felix@gavinhogroup.com" },
    { name: "Maria Gavinho", email: "maria.gavinho@gavinhogroup.com" },
    { name: "Rute Santos", email: "rute.santos@by-gavinho.com" },
    { name: "Leonor Traguil", email: "leonor.traguil@by-gavinho.com" },
    { name: "Joao Umbelino", email: "joao.umbelino@by-gavinho.com" },
    { name: "Caroline Roda", email: "caroline.roda@by-gavinho.com" },
    { name: "Luciana Ortega", email: "luciana.ortega@by-gavinho.com" },
    { name: "Carolina Cipriano", email: "carolina.cipriano@by-gavinho.com" },
    { name: "Giovana Martins", email: "giovana.martins@by-gavinho.com" },
    { name: "Lais Silva", email: "lais.silva@by-gavinho.com" },
    { name: "Ana Miranda", email: "ana.miranda@by-gavinho.com" },
    { name: "Patricia Morais", email: "patricia.morais@by-gavinho.com" },
    { name: "Nathalia Bampi", email: "nathalia.bampi@by-gavinho.com" },
    { name: "Nathalia Silva", email: "nathalia.silva@by-gavinho.com" },
    { name: "Raquel Sonobe", email: "raquel.sonobe@by-gavinho.com" },
  ];

  const features = [
    { icon: "📊", title: "Dashboard Executivo", desc: "Métricas e KPIs em tempo real" },
    { icon: "🏗️", title: "Gestão de Projetos", desc: "Controlo total de obras e construções" },
    { icon: "📦", title: "Fornecedores", desc: "Gestão de encomendas e orçamentos" },
    { icon: "✅", title: "Tarefas", desc: "Workflow e acompanhamento de atividades" },
    { icon: "🎨", title: "Galeria Archviz", desc: "Renders com anotações e markup" },
    { icon: "📐", title: "Design Review", desc: "Briefing e aprovações de design" },
    { icon: "📈", title: "Análise Preditiva", desc: "Simulações e cenários futuros" },
    { icon: "💼", title: "Gestão Documental", desc: "Centralização de documentos" },
  ];

  const loginSteps = [
    { number: "1", title: "Aceder à Plataforma", desc: "Clique no botão 'Aceder' abaixo" },
    { number: "2", title: "Clicar em Login", desc: "Na página inicial, clique em 'Login' ou 'Entrar'" },
    { number: "3", title: "Introduzir Email", desc: "Use o email registado (ver lista abaixo)" },
    { number: "4", title: "Autenticação OAuth", desc: "Siga o fluxo seguro da Manus OAuth" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              <Shield className="mr-2 h-3 w-3" />
              Portal de Acesso Seguro
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Gavinho Project Manager
            </h1>
            <p className="text-xl text-red-100 mb-8">
              Plataforma de gestão integrada para a equipa Gavinho Group
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-700 hover:bg-red-50">
                <Key className="mr-2 h-5 w-5" />
                Aceder à Plataforma
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Ver Instruções
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      <div className="container py-12 md:py-16">
        {/* Login Steps */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Como Fazer Login</h2>
            <p className="text-lg text-slate-600">Siga estes 4 passos simples para aceder à plataforma</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {loginSteps.map((step, idx) => (
              <Card key={idx} className="relative border-2 hover:border-red-200 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-xl font-bold">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{step.title}</CardTitle>
                      <CardDescription className="text-sm">{step.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {idx < loginSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-red-300">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-8 border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Lock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Sistema de Autenticação OAuth</p>
                  <p className="text-sm text-slate-700">
                    A plataforma utiliza <strong>autenticação OAuth da Manus</strong>. Não existem passwords manuais - 
                    o acesso é feito de forma segura através do sistema OAuth usando o seu email registado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Team Members */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Utilizadores Registados</h2>
            <p className="text-lg text-slate-600">
              <Users className="inline h-5 w-5 mr-2" />
              {teamMembers.length} membros da equipa com acesso à plataforma
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {teamMembers.map((member, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 mb-1">{member.name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Ativo
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Funcionalidades Disponíveis</h2>
            <p className="text-lg text-slate-600">Tudo o que precisa para gerir os seus projetos</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <Card key={idx} className="text-center hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-xs">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Security & Support */}
        <section>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Shield className="h-5 w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-800 space-y-2">
                <p>✓ Autenticação OAuth segura e centralizada</p>
                <p>✓ Sem necessidade de passwords manuais</p>
                <p>✓ Acesso controlado por email registado</p>
                <p>✓ Conexão encriptada (HTTPS)</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="h-5 w-5" />
                  Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>📧 Verificar se o email está correto</p>
                <p>🔐 Confirmar acesso ao OAuth da Manus</p>
                <p>👤 Contactar administrador do sistema</p>
                <p>📞 Suporte técnico disponível</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-slate-500">
          <p>Data de registo: 06/01/2026 • Sistema: Gavinho Project Manager</p>
          <p className="mt-1">Autenticação: Manus OAuth • Base de dados: MySQL (TiDB)</p>
        </div>
      </div>
    </div>
  );
}
