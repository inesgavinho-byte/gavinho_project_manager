import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Library,
  Folder,
  TrendingUp,
  Calendar,
  Sparkles,
  HardHat,
  Clock,
  FileText,
  ClipboardList,
  BookOpen,
  FileCheck,
  Shield,
  Users,
  Building2,
  Truck,
  FileSignature,
  ShoppingCart,
  User,
  Bell,
  ChevronDown,
  ChevronRight,
  DollarSign,
  UserCog,
  BarChart3,
  AlertCircle,
  Settings,
  History,
  Mail,
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModularSidebarProps {
  onNavigate?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  submenus?: MenuItem[];
  badge?: number;
}

interface Module {
  id: string;
  title: string;
  items: MenuItem[];
}

export function ModularSidebar({ onNavigate }: ModularSidebarProps) {
  const [location] = useLocation();
  const [expandedModules, setExpandedModules] = useState<string[]>(["projetos"]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const modules: Module[] = [
    {
      id: "projetos",
      title: "PROJETOS",
      items: [
        {
          id: "dashboard-projetos",
          label: "Dashboard Projetos",
          icon: LayoutDashboard,
          path: "/",
        },
        {
          id: "executive-dashboard",
          label: "Dashboard Executivo",
          icon: BarChart3,
          path: "/executive-dashboard",
        },
        {
          id: "projetos",
          label: "Projetos",
          icon: FolderKanban,
          path: "/projects",
        },
        {
          id: "chat-projetos",
          label: "Chat Projetos",
          icon: MessageSquare,
          path: "/projects-chat",
          badge: 3,
        },
        {
          id: "contracts-dashboard",
          label: "Análise de Contratos",
          icon: BarChart3,
          path: "/contracts-dashboard",
        },
        {
          id: "contract-history",
          label: "Histórico de Contratos",
          icon: History,
          path: "/contract-history",
        },
        {
          id: "contract-metrics",
          label: "Métricas de Contratos",
          icon: BarChart3,
          path: "/contract-metrics",
        },
        {
          id: "biblioteca",
          label: "Biblioteca",
          icon: Library,
          path: "/biblioteca",
        },
        {
          id: "calendario",
          label: "Calendário",
          icon: Calendar,
          path: "/calendar",
        },
        {
          id: "sugestoes-ia",
          label: "Sugestões IA",
          icon: Sparkles,
          path: "/sugestoes-ia",
        },
        {
          id: "mqa",
          label: "Mapas de Quantidades",
          icon: Grid3x3,
          path: "/mqa",
        },
      ],
    },
    {
      id: "obras",
      title: "OBRAS",
      items: [
        {
          id: "dashboard-obras",
          label: "Dashboard Obras",
          icon: LayoutDashboard,
          path: "/works-dashboard",
        },
        {
          id: "obras",
          label: "Obras",
          icon: HardHat,
          path: "/works",
        },
        {
          id: "calendario-obras",
          label: "Calendário",
          icon: Calendar,
          path: "/works/calendar",
        },
        {
          id: "chat-obras",
          label: "Chat Obras",
          icon: MessageSquare,
          path: "/works-chat",
          badge: 7,
        },
        {
          id: "timesheets",
          label: "Timesheets",
          icon: Clock,
          path: "/timesheets",
        },
        {
          id: "requisicoes",
          label: "Requisições",
          icon: ClipboardList,
          path: "/works/requisitions",
        },
        {
          id: "diario-obra",
          label: "Diário de Obra",
          icon: BookOpen,
          submenus: [
            {
              id: "diario-obra-diario",
              label: "Diário de Obra",
              icon: FileText,
              path: "/works-diary",
            },
            {
              id: "diario-obra-direcao",
              label: "Direção Obra",
              icon: FileCheck,
              path: "/works-direction",
            },
            {
              id: "diario-obra-fiscalizacao",
              label: "Fiscalização",
              icon: Shield,
              path: "/works-inspection",
            },
          ],
        },
        {
          id: "licencas",
          label: "Licenças",
          icon: FileSignature,
          path: "/works-licenses",
        },
      ],
    },
    {
      id: "gestao",
      title: "GESTÃO",
      items: [
        {
          id: "financial-dashboard",
          label: "Dashboard Financeiro",
          icon: DollarSign,
          path: "/financial-dashboard",
        },
        {
          id: "budget-alerts",
          label: "Alertas de Orçamento",
          icon: AlertCircle,
          path: "/budget-alerts",
        },
        {
          id: "cost-prediction",
          label: "Previsão de Custos IA",
          icon: TrendingUp,
          path: "/cost-prediction",
        },
        {
          id: "report-builder",
          label: "Builder de Relatórios",
          icon: FileText,
          path: "/report-builder",
        },
        {
          id: "team-management",
          label: "Gestão de Equipa",
          icon: UserCog,
          path: "/team-management",
        },
        {
          id: "user-management",
          label: "Gestão de Utilizadores",
          icon: Shield,
          path: "/user-management",
        },
        {
          id: "team-productivity",
          label: "Produtividade Equipa",
          icon: BarChart3,
          path: "/team-productivity",
        },
        {
          id: "recursos-humanos",
          label: "Recursos Humanos",
          icon: Users,
          path: "/recursos-humanos",
        },
        {
          id: "clientes",
          label: "Clientes",
          icon: Building2,
          path: "/clients",
        },
        {
          id: "fornecedores",
          label: "Fornecedores",
          icon: Truck,
          path: "/suppliers",
        },
        {
          id: "propostas-contrato",
          label: "Propostas Contrato",
          icon: FileSignature,
          path: "/proposals-contracts",
        },
        {
          id: "compras",
          label: "Compras",
          icon: ShoppingCart,
          path: "/purchases",
        },
      ],
    },
    {
      id: "comunicacao",
      title: "COMUNICAÇÃO",
      items: [
        {
          id: "email-history",
          label: "Histórico de Emails",
          icon: Mail,
          path: "/email-history",
        },
        {
          id: "crm",
          label: "Gestão de Contatos (CRM)",
          icon: Users,
          path: "/crm",
        },
        {
          id: "sentiment-analysis",
          label: "Análise de Sentimento",
          icon: AlertCircle,
          path: "/sentiment-analysis",
        },
        {
          id: "scheduled-reports",
          label: "Relatórios Agendados",
          icon: FileText,
          path: "/scheduled-reports",
        },
        {
          id: "recommended-actions",
          label: "Ações Recomendadas",
          icon: Sparkles,
          path: "/recommended-actions",
        },
        {
          id: "calendar-integration",
          label: "Integração com Calendário",
          icon: Calendar,
          path: "/calendar-integration",
        },
        {
          id: "performance",
          label: "Dashboard de Performance",
          icon: TrendingUp,
          path: "/performance",
        },
        {
          id: "email-automation",
          label: "Automação de Emails",
          icon: Mail,
          path: "/email-automation",
        },
      ],
    },
    {
      id: "perfil",
      title: "PERFIL UTILIZADOR",
      items: [
        {
          id: "mencoes-notificacoes",
          label: "Menções & Notificações",
          icon: Bell,
          path: "/mencoes",
          badge: 5,
        },
        {
          id: "notification-history",
          label: "Histórico de Notificações",
          icon: History,
          path: "/notification-history",
        },
        {
          id: "notification-preferences",
          label: "Preferências de Notificações",
          icon: Settings,
          path: "/notification-preferences",
        },
      ],
    },
  ];

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location === path || location.startsWith(path + "/");
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasSubmenus = item.submenus && item.submenus.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = isActive(item.path);

    if (hasSubmenus) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleMenu(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-lg relative",
              level > 0 && "pl-8",
              active
                ? "bg-[#C9A882] text-white font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#5F5C59] before:rounded-l-lg"
                : "text-[#5F5C59] hover:bg-[#F2F0E7]"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.submenus!.map((submenu) => renderMenuItem(submenu, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.path || "#"}
        onClick={onNavigate}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-lg relative",
            level > 0 && "pl-8",
            active
              ? "bg-[#C9A882] text-white font-medium before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#5F5C59] before:rounded-l-lg"
              : "text-[#5F5C59] hover:bg-[#F2F0E7]"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </div>
          {item.badge && item.badge > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="h-full bg-white border-r border-[#C9A882]/20 overflow-y-auto animate-in slide-in-from-left duration-300">
      <Link href="/dashboard" onClick={onNavigate}>
        <div className="p-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/gavinho-icon.png" 
            alt="GAVINHO" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-2xl font-bold text-[#5F5C59] tracking-tight">
            GAVINHO
          </h1>
        </div>
      </Link>
        <Link to="/bia-insights" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
          <BarChart3 className="w-4 h-4" />
          <span>Insights BIA</span>
        </Link>

      <nav className="px-3 pb-6 space-y-6">
        {modules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          
          return (
            <div key={module.id} className="space-y-1">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-[#C9A882] hover:bg-[#F2F0E7] rounded-lg transition-colors"
              >
                <span>{module.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-1 mt-1">
                  {module.items.map((item) => renderMenuItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
