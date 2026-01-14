import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectsCompare from "./pages/ProjectsCompare";
import Suppliers from "./pages/Suppliers";
import Orders from "./pages/Orders";
import Tasks from "./pages/Tasks";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Emails from "./pages/Emails";
import EmailHistory from "./pages/EmailHistory";
import { CRMDashboard } from "./components/CRMDashboard";
import { SentimentAnalysisDashboard } from "./components/SentimentAnalysisDashboard";
import { ScheduledReportsDashboard } from "./components/ScheduledReportsDashboard";
import { RecommendedActionsDashboard } from "./components/RecommendedActionsDashboard";
import { CalendarIntegration } from "./components/CalendarIntegration";
import { PerformanceDashboard } from "./components/PerformanceDashboard";
import { EmailAutomation } from "./components/EmailAutomation";
import AISuggestions from "./pages/AISuggestions";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import Predictions from "./pages/Predictions";
import WhatIfSimulation from "./pages/WhatIfSimulation";
import ActivityFeed from "./pages/ActivityFeed";
import Mentions from "./pages/Mentions";
import { ImportContracts } from "./pages/ImportContracts";
import ContractsDashboard from "./pages/ContractsDashboard";
import ContractHistory from "./pages/ContractHistory";
import ContractMetrics from "./pages/ContractMetrics";
import NotificationPreferences from "./pages/NotificationPreferences";
import NotificationHistory from "./pages/NotificationHistory";
import Constructions from "./pages/Constructions";
import ConstructionDetails from "./pages/ConstructionDetails";
import ConstructionsCompare from "./pages/ConstructionsCompare";
import MqtAnalyticsDashboard from "./pages/MqtAnalyticsDashboard";
import SiteQuantityMap from "./pages/SiteQuantityMap";
import SiteMobileQuantityMap from "./pages/SiteMobileQuantityMap";
import SiteQuantityMapAnalytics from "./pages/SiteQuantityMapAnalytics";
import SiteProductivityGoals from "./pages/SiteProductivityGoals";
import Trash from "./pages/Trash";
import TeamAccess from "./pages/TeamAccess";
import UserProfile from "./pages/UserProfile";
import HumanResources from "./pages/HumanResources";
import Timesheets from "./pages/Timesheets";
import HRReports from "./pages/HRReports";
import SiteMobile from "./pages/SiteMobile";
import SiteNonCompliances from "./pages/SiteNonCompliances";
import SiteDashboard from "./pages/SiteDashboard";
import SiteMaterials from "./pages/SiteMaterials";
import SiteAttendance from "./pages/SiteAttendance";
import SiteWorkers from "./pages/SiteWorkers";

import SiteManagement from "./pages/SiteManagement";
import WorksDashboard from "./pages/WorksDashboard";
import Works from "./pages/Works";
import WorksChat from "./pages/WorksChat";
import WorksDiary from "./pages/WorksDiary";
import WorksDirection from "./pages/WorksDirection";
import FinancialDashboard from "./pages/FinancialDashboard";
import TeamManagement from "./pages/TeamManagement";
import UserManagement from "./pages/UserManagement";
import TeamProductivityDashboard from "./pages/TeamProductivityDashboard";
import WorksInspection from "./pages/WorksInspection";
import WorksLicenses from "./pages/WorksLicenses";
import ProjectsChat from "./pages/ProjectsChat";
import ProposalsContracts from "./pages/ProposalsContracts";
import Purchases from "./pages/Purchases";
import RelationshipsDashboard from "./pages/RelationshipsDashboard";
import Clients from "./pages/Clients";
import Library from "./pages/Library";
import Collections from "./pages/Collections";
import MaterialsAnalytics from "./pages/MaterialsAnalytics";
import BudgetAlerts from "./pages/BudgetAlerts";
import CostPredictionDashboard from "./pages/CostPredictionDashboard";
import ReportBuilder from "./pages/ReportBuilder";
import CalendarPage from "./pages/CalendarPage";
import TestLogin from "./pages/TestLogin";
import Login from "./pages/Login";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { RealtimeNotifications } from "./components/RealtimeNotifications";

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>

      <Route path="/test-login">
        <TestLogin />
      </Route>

      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/projects">
        <DashboardLayout>
          <Projects />
        </DashboardLayout>
      </Route>

      <Route path="/import-contracts">
        <DashboardLayout>
          <ImportContracts />
        </DashboardLayout>
      </Route>
      
      <Route path="/projects/compare">
        <DashboardLayout>
          <ProjectsCompare />
        </DashboardLayout>
      </Route>
      
      <Route path="/contracts-dashboard">
        <DashboardLayout>
          <ContractsDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/contract-history">
        <DashboardLayout>
          <ContractHistory />
        </DashboardLayout>
      </Route>
      
      <Route path="/contract-metrics">
        <DashboardLayout>
          <ContractMetrics />
        </DashboardLayout>
      </Route>
      
      <Route path="/notification-preferences">
        <DashboardLayout>
          <NotificationPreferences />
        </DashboardLayout>
      </Route>
      
      <Route path="/notification-history">
        <DashboardLayout>
          <NotificationHistory />
        </DashboardLayout>
      </Route>
      
      <Route path="/projects/:id">
        <DashboardLayout>
          <ProjectDetails />
        </DashboardLayout>
      </Route>
      
      <Route path="/team-access">
        <TeamAccess />
      </Route>
      
      <Route path="/hr">
        <DashboardLayout>
          <HumanResources />
        </DashboardLayout>
      </Route>
      
      <Route path="/timesheets">
        <DashboardLayout>
          <Timesheets />
        </DashboardLayout>
      </Route>
      
      <Route path="/hr-reports">
        <DashboardLayout>
          <HRReports />
        </DashboardLayout>
      </Route>
      
      <Route path="/profile">
        <DashboardLayout>
          <UserProfile />
        </DashboardLayout>
      </Route>
      
      <Route path="/trash">
        <DashboardLayout>
          <Trash />
        </DashboardLayout>
      </Route>
      
      <Route path="/constructions">
        <DashboardLayout>
          <Constructions />
        </DashboardLayout>
      </Route>
      
      <Route path="/constructions/compare">
        <DashboardLayout>
          <ConstructionsCompare />
        </DashboardLayout>
      </Route>
      
      <Route path="/constructions/:id">
        <DashboardLayout>
          <ConstructionDetails />
        </DashboardLayout>
      </Route>
      
      <Route path="/constructions/:id/analytics">
        <DashboardLayout>
          <MqtAnalyticsDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/site-management/:id/quantity-map">
        <SiteQuantityMap />
      </Route>
      
      <Route path="/site-management/:id/quantity-map-mobile">
        <SiteMobileQuantityMap />
      </Route>
      
      <Route path="/site-management/:id/quantity-map-analytics">
        <SiteQuantityMapAnalytics />
      </Route>
      
      <Route path="/site-management/:id/productivity-goals">
        <SiteProductivityGoals />
      </Route>
      
      <Route path="/suppliers">
        <DashboardLayout>
          <Suppliers />
        </DashboardLayout>
      </Route>
      
      <Route path="/orders">
        <DashboardLayout>
          <Orders />
        </DashboardLayout>
      </Route>
      
      <Route path="/tasks">
        <DashboardLayout>
          <Tasks />
        </DashboardLayout>
      </Route>
      
      <Route path="/budgets">
        <DashboardLayout>
          <Budgets />
        </DashboardLayout>
      </Route>
      
      <Route path="/biblioteca">
        <DashboardLayout>
          <Library />
        </DashboardLayout>
      </Route>
      <Route path="/colecoes">
        <DashboardLayout>
          <Collections />
        </DashboardLayout>
      </Route>
      <Route path="/analise-materiais">
        <DashboardLayout>
          <MaterialsAnalytics />
        </DashboardLayout>
      </Route>
      
      <Route path="/reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>
      
      <Route path="/emails">
        <DashboardLayout>
          <Emails />
        </DashboardLayout>
      </Route>
      
      <Route path="/email-history">
        <DashboardLayout>
          <EmailHistory />
        </DashboardLayout>
      </Route>
      
      <Route path="/crm">
        <DashboardLayout>
          <CRMDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/sentiment-analysis">
        <DashboardLayout>
          <SentimentAnalysisDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/scheduled-reports">
        <DashboardLayout>
          <ScheduledReportsDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/recommended-actions">
        <DashboardLayout>
          <RecommendedActionsDashboard projectId={1} />
        </DashboardLayout>
      </Route>
      
      <Route path="/calendar-integration">
        <DashboardLayout>
          <CalendarIntegration projectId={1} />
        </DashboardLayout>
      </Route>
      
      <Route path="/performance">
        <DashboardLayout>
          <PerformanceDashboard projectId={1} />
        </DashboardLayout>
      </Route>
      
      <Route path="/email-automation">
        <DashboardLayout>
          <EmailAutomation projectId={1} />
        </DashboardLayout>
      </Route>
      
      <Route path="/ai-suggestions">
        <DashboardLayout>
          <AISuggestions />
        </DashboardLayout>
      </Route>

      <Route path="/notifications">
        <DashboardLayout>
          <Notifications />
        </DashboardLayout>
      </Route>

      <Route path="/notification-settings">
        <DashboardLayout>
          <NotificationSettings />
        </DashboardLayout>
      </Route>

      <Route path="/predictions">
        <DashboardLayout>
          <Predictions />
        </DashboardLayout>
      </Route>

      <Route path="/what-if">
        <DashboardLayout>
          <WhatIfSimulation />
        </DashboardLayout>
      </Route>

      <Route path="/activity-feed">
        <DashboardLayout>
          <ActivityFeed />
        </DashboardLayout>
      </Route>

      <Route path="/mentions">
        <DashboardLayout>
          <Mentions />
        </DashboardLayout>
      </Route>

      <Route path="/calendar">
        <CalendarPage />
      </Route>

      {/* Works Module Routes */}
      <Route path="/works-dashboard">
        <DashboardLayout>
          <WorksDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/works">
        <DashboardLayout>
          <Works />
        </DashboardLayout>
      </Route>

      <Route path="/works-chat">
        <DashboardLayout>
          <WorksChat />
        </DashboardLayout>
      </Route>

      <Route path="/works-diary">
        <DashboardLayout>
          <WorksDiary />
        </DashboardLayout>
      </Route>

      <Route path="/works-direction">
        <DashboardLayout>
          <WorksDirection />
        </DashboardLayout>
      </Route>

      <Route path="/works-inspection">
        <DashboardLayout>
          <WorksInspection />
        </DashboardLayout>
      </Route>

      <Route path="/works-licenses">
        <DashboardLayout>
          <WorksLicenses />
        </DashboardLayout>
      </Route>

      {/* Projects Module Routes */}
      <Route path="/projects-chat">
        <DashboardLayout>
          <ProjectsChat />
        </DashboardLayout>
      </Route>

      {/* Management Module Routes */}
      <Route path="/financial-dashboard">
        <DashboardLayout>
          <FinancialDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/budget-alerts">
        <DashboardLayout>
          <BudgetAlerts />
        </DashboardLayout>
      </Route>
      
      <Route path="/cost-prediction">
        <DashboardLayout>
          <CostPredictionDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/report-builder">
        <DashboardLayout>
          <ReportBuilder />
        </DashboardLayout>
      </Route>
      
      <Route path="/calendario">
        <DashboardLayout>
          <CalendarPage />
        </DashboardLayout>
      </Route>

      <Route path="/team-management">
        <DashboardLayout>
          <TeamManagement />
        </DashboardLayout>
      </Route>

      <Route path="/user-management">
        <DashboardLayout>
          <UserManagement />
        </DashboardLayout>
      </Route>

      <Route path="/team-productivity">
        <DashboardLayout>
          <TeamProductivityDashboard />
        </DashboardLayout>
      </Route>

      <Route path="/proposals-contracts">
        <DashboardLayout>
          <ProposalsContracts />
        </DashboardLayout>
      </Route>

      <Route path="/purchases">
        <DashboardLayout>
          <Purchases />
        </DashboardLayout>
      </Route>

      <Route path="/relationships">
        <DashboardLayout>
          <RelationshipsDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/clients">
        <DashboardLayout>
          <Clients />
        </DashboardLayout>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <RealtimeNotifications position="top-right" maxNotifications={5} />
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
