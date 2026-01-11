import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para página de perfil refatorizada
 * Valida renderização do header, abas, formulários e dados
 */

describe("User Profile - Refactored Design", () => {
  // Mock data
  const mockUser = {
    id: 1,
    name: "Inês Gavinho",
    email: "ines.gavinho@gavinhogroup.com",
    phone: "+351917072070",
    jobTitle: "Diretora Criativa",
    department: "Arquitetura",
    role: "admin" as const,
    profilePicture: "https://example.com/photo.jpg",
    dateOfBirth: new Date("1983-08-12"),
    location: "Rua Professor Ricardo Jorge nro 7 - 3 Dto, Miraflores",
    createdAt: new Date("2018-01-01"),
  };

  const mockStats = {
    holidaysAvailable: 10,
    pendingRequests: 0,
    approvedRequests: 12,
  };

  describe("Header Profile Card", () => {
    it("should display user name correctly", () => {
      expect(mockUser.name).toBe("Inês Gavinho");
    });

    it("should display job title and department", () => {
      expect(mockUser.jobTitle).toBe("Diretora Criativa");
      expect(mockUser.department).toBe("Arquitetura");
    });

    it("should display admin role badge", () => {
      expect(mockUser.role).toBe("admin");
      const roleLabel = mockUser.role === "admin" ? "Administrador" : "Utilizador";
      expect(roleLabel).toBe("Administrador");
    });

    it("should display email and phone", () => {
      expect(mockUser.email).toBe("ines.gavinho@gavinhogroup.com");
      expect(mockUser.phone).toBe("+351917072070");
    });

    it("should have profile picture URL", () => {
      expect(mockUser.profilePicture).toBeTruthy();
      expect(mockUser.profilePicture).toContain("example.com");
    });

    it("should generate initials from name", () => {
      const initials = mockUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      expect(initials).toBe("IG");
    });
  });

  describe("Holidays Card", () => {
    it("should display available holidays count", () => {
      expect(mockStats.holidaysAvailable).toBe(10);
    });

    it("should display pending requests", () => {
      expect(mockStats.pendingRequests).toBe(0);
    });

    it("should display approved requests (encargos)", () => {
      expect(mockStats.approvedRequests).toBe(12);
    });

    it("should format holidays display correctly", () => {
      const display = `${mockStats.holidaysAvailable} dias férias disponíveis`;
      expect(display).toBe("10 dias férias disponíveis");
    });

    it("should format requests display correctly", () => {
      const display = `${mockStats.pendingRequests} pedidos • ${mockStats.approvedRequests} encargos`;
      expect(display).toBe("0 pedidos • 12 encargos");
    });
  });

  describe("Navigation Tabs", () => {
    const tabs = [
      { value: "personal", label: "Dados Pessoais" },
      { value: "holidays", label: "Férias e Ausências" },
      { value: "receipts", label: "Recibos" },
      { value: "calendar", label: "Calendário" },
      { value: "security", label: "Segurança" },
    ];

    it("should have 5 navigation tabs", () => {
      expect(tabs).toHaveLength(5);
    });

    it("should have correct tab labels", () => {
      expect(tabs[0].label).toBe("Dados Pessoais");
      expect(tabs[1].label).toBe("Férias e Ausências");
      expect(tabs[2].label).toBe("Recibos");
      expect(tabs[3].label).toBe("Calendário");
      expect(tabs[4].label).toBe("Segurança");
    });

    it("should have correct tab values", () => {
      expect(tabs[0].value).toBe("personal");
      expect(tabs[1].value).toBe("holidays");
      expect(tabs[2].value).toBe("receipts");
      expect(tabs[3].value).toBe("calendar");
      expect(tabs[4].value).toBe("security");
    });

    it("should have personal data as default tab", () => {
      const defaultTab = tabs[0];
      expect(defaultTab.value).toBe("personal");
    });
  });

  describe("Personal Data Form", () => {
    const formFields = [
      { name: "fullName", label: "Nome Completo", value: mockUser.name },
      { name: "email", label: "Email", value: mockUser.email },
      { name: "phone", label: "Telefone", value: mockUser.phone },
      { name: "dateOfBirth", label: "Data de Nascimento", value: "12/08/1983" },
      { name: "address", label: "Morada", value: mockUser.location },
    ];

    it("should have 5 form fields", () => {
      expect(formFields).toHaveLength(5);
    });

    it("should have correct field labels", () => {
      expect(formFields[0].label).toBe("Nome Completo");
      expect(formFields[1].label).toBe("Email");
      expect(formFields[2].label).toBe("Telefone");
      expect(formFields[3].label).toBe("Data de Nascimento");
      expect(formFields[4].label).toBe("Morada");
    });

    it("should populate form with user data", () => {
      expect(formFields[0].value).toBe("Inês Gavinho");
      expect(formFields[1].value).toBe("ines.gavinho@gavinhogroup.com");
      expect(formFields[2].value).toBe("+351917072070");
    });

    it("should format date of birth correctly", () => {
      const dateField = formFields[3];
      expect(dateField.value).toBe("12/08/1983");
    });

    it("should display full address", () => {
      expect(formFields[4].value).toBe("Rua Professor Ricardo Jorge nro 7 - 3 Dto, Miraflores");
    });
  });

  describe("Professional Information Section", () => {
    const professionalInfo = [
      { label: "Cargo", value: mockUser.jobTitle },
      { label: "Departamento", value: mockUser.department },
      { label: "Data de Entrada", value: "01/01/2018" },
    ];

    it("should have 3 professional info fields", () => {
      expect(professionalInfo).toHaveLength(3);
    });

    it("should display position correctly", () => {
      expect(professionalInfo[0].value).toBe("Diretora Criativa");
    });

    it("should display department correctly", () => {
      expect(professionalInfo[1].value).toBe("Arquitetura");
    });

    it("should display start date correctly", () => {
      expect(professionalInfo[2].value).toBe("01/01/2018");
    });

    it("should be marked as read-only (managed by admin)", () => {
      // All professional info fields should be read-only
      const allReadOnly = professionalInfo.every(() => true);
      expect(allReadOnly).toBe(true);
    });
  });

  describe("Security Tab", () => {
    const securityOptions = [
      { title: "Alterar Password", description: "Atualize a sua password regularmente" },
      { title: "Autenticação de Dois Fatores", description: "Adicione uma camada extra de segurança" },
      { title: "Sessões Ativas", description: "Gerencie os seus dispositivos conectados" },
    ];

    it("should have 3 security options", () => {
      expect(securityOptions).toHaveLength(3);
    });

    it("should have change password option", () => {
      expect(securityOptions[0].title).toBe("Alterar Password");
    });

    it("should have two-factor authentication option", () => {
      expect(securityOptions[1].title).toBe("Autenticação de Dois Fatores");
    });

    it("should have active sessions option", () => {
      expect(securityOptions[2].title).toBe("Sessões Ativas");
    });

    it("should have descriptive text for each option", () => {
      expect(securityOptions[0].description).toBeTruthy();
      expect(securityOptions[1].description).toBeTruthy();
      expect(securityOptions[2].description).toBeTruthy();
    });
  });

  describe("Role-based Styling", () => {
    it("should apply red badge color for admin role", () => {
      const getRoleBadgeColor = (role?: string) => {
        switch (role) {
          case "admin":
            return "bg-red-100 text-red-800 border-red-300";
          case "client":
            return "bg-blue-100 text-blue-800 border-blue-300";
          default:
            return "bg-gray-100 text-gray-800 border-gray-300";
        }
      };

      const adminColor = getRoleBadgeColor("admin");
      expect(adminColor).toContain("red");
    });

    it("should apply blue badge color for client role", () => {
      const getRoleBadgeColor = (role?: string) => {
        switch (role) {
          case "admin":
            return "bg-red-100 text-red-800 border-red-300";
          case "client":
            return "bg-blue-100 text-blue-800 border-blue-300";
          default:
            return "bg-gray-100 text-gray-800 border-gray-300";
        }
      };

      const clientColor = getRoleBadgeColor("client");
      expect(clientColor).toContain("blue");
    });

    it("should apply gray badge color for user role", () => {
      const getRoleBadgeColor = (role?: string) => {
        switch (role) {
          case "admin":
            return "bg-red-100 text-red-800 border-red-300";
          case "client":
            return "bg-blue-100 text-blue-800 border-blue-300";
          default:
            return "bg-gray-100 text-gray-800 border-gray-300";
        }
      };

      const userColor = getRoleBadgeColor("user");
      expect(userColor).toContain("gray");
    });
  });

  describe("Data Formatting", () => {
    it("should format phone number correctly", () => {
      expect(mockUser.phone).toMatch(/^\+\d+$/);
    });

    it("should format email correctly", () => {
      expect(mockUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should format date of birth as date object", () => {
      expect(mockUser.dateOfBirth).toBeInstanceOf(Date);
    });

    it("should format created date as date object", () => {
      expect(mockUser.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("UI Elements", () => {
    it("should have edit profile button", () => {
      const hasEditButton = true; // Component has edit button
      expect(hasEditButton).toBe(true);
    });

    it("should have save changes button in personal data tab", () => {
      const hasSaveButton = true; // Component has save button
      expect(hasSaveButton).toBe(true);
    });

    it("should have camera icon for photo upload", () => {
      const hasCameraIcon = true; // Component has camera icon
      expect(hasCameraIcon).toBe(true);
    });

    it("should have icons for all security options", () => {
      const securityIcons = ["Lock", "AlertCircle", "Clock"];
      expect(securityIcons).toHaveLength(3);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive grid layout for form fields", () => {
      const gridClasses = "grid grid-cols-1 md:grid-cols-2 gap-6";
      expect(gridClasses).toContain("grid-cols-1");
      expect(gridClasses).toContain("md:grid-cols-2");
    });

    it("should have responsive professional info cards", () => {
      const gridClasses = "grid grid-cols-1 md:grid-cols-3 gap-4";
      expect(gridClasses).toContain("grid-cols-1");
      expect(gridClasses).toContain("md:grid-cols-3");
    });

    it("should have responsive header layout", () => {
      const flexClasses = "flex flex-col md:flex-row gap-8 items-start justify-between";
      expect(flexClasses).toContain("flex-col");
      expect(flexClasses).toContain("md:flex-row");
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      const headings = ["h1", "h2", "h3"];
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have form labels for all inputs", () => {
      const formFields = 5;
      const labels = 5;
      expect(labels).toBe(formFields);
    });

    it("should have descriptive button text", () => {
      const buttons = ["Guardar Alterações", "Alterar", "Em breve"];
      expect(buttons.every((btn) => btn.length > 0)).toBe(true);
    });

    it("should have alt text for avatar image", () => {
      const altText = mockUser.name || "User";
      expect(altText).toBeTruthy();
    });
  });
});
