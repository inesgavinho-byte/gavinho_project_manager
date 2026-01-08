import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Library,
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
          id: "projetos",
          label: "Projetos",
          icon: FolderKanban,
          path: "/projects",
        },
        {
          id: "chat-projetos",
          label: "Chat Projetos",
          icon: MessageSquare,
          path: "/chat-projetos",
          badge: 3,
        },
        {
          id: "biblioteca",
          label: "Biblioteca",
          icon: Library,
          path: "/biblioteca",
        },
        {
          id: "calendario-projetos",
          label: "Calendário",
          icon: Calendar,
          path: "/calendario-projetos",
        },
        {
          id: "sugestoes-ia",
          label: "Sugestões IA",
          icon: Sparkles,
          path: "/sugestoes-ia",
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
          path: "/obras/dashboard",
        },
        {
          id: "obras",
          label: "Obras",
          icon: HardHat,
          path: "/obras",
        },
        {
          id: "calendario-obras",
          label: "Calendário",
          icon: Calendar,
          path: "/obras/calendario",
        },
        {
          id: "chat-obras",
          label: "Chat Obras",
          icon: MessageSquare,
          path: "/obras/chat",
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
          path: "/requisicoes",
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
              path: "/diario-obra/diario",
            },
            {
              id: "diario-obra-direcao",
              label: "Direção Obra",
              icon: FileCheck,
              path: "/diario-obra/direcao",
            },
            {
              id: "diario-obra-fiscalizacao",
              label: "Fiscalização",
              icon: Shield,
              path: "/diario-obra/fiscalizacao",
            },
          ],
        },
        {
          id: "licencas",
          label: "Licenças",
          icon: FileSignature,
          path: "/licencas",
        },
      ],
    },
    {
      id: "gestao",
      title: "GESTÃO",
      items: [
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
          path: "/propostas-contrato",
        },
        {
          id: "compras",
          label: "Compras",
          icon: ShoppingCart,
          path: "/orders",
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
              "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-lg",
              level > 0 && "pl-8",
              active
                ? "bg-[#C9A882] text-white font-medium"
                : "text-[#5F5C59] hover:bg-[#C3BAAF]/10"
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
            "flex items-center justify-between px-4 py-2.5 text-sm transition-colors rounded-lg",
            level > 0 && "pl-8",
            active
              ? "bg-[#C9A882] text-white font-medium"
              : "text-[#5F5C59] hover:bg-[#C3BAAF]/10"
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
    <div className="h-full bg-white border-r border-[#C3BAAF]/20 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#5F5C59] tracking-tight">
          GAVINHO
        </h1>
      </div>

      <nav className="px-3 pb-6 space-y-6">
        {modules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          
          return (
            <div key={module.id} className="space-y-1">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-[#C9A882] hover:bg-[#C3BAAF]/5 rounded-lg transition-colors"
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
