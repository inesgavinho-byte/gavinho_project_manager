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
import Suppliers from "./pages/Suppliers";
import Orders from "./pages/Orders";
import Tasks from "./pages/Tasks";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Emails from "./pages/Emails";
import AISuggestions from "./pages/AISuggestions";
import Notifications from "./pages/Notifications";
import Predictions from "./pages/Predictions";
import WhatIfSimulation from "./pages/WhatIfSimulation";
import ActivityFeed from "./pages/ActivityFeed";
import Mentions from "./pages/Mentions";
import Constructions from "./pages/Constructions";
import ConstructionDetails from "./pages/ConstructionDetails";
import MqtAnalyticsDashboard from "./pages/MqtAnalyticsDashboard";

function Router() {
  return (
    <Switch>
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
      
      <Route path="/projects/:id">
        <DashboardLayout>
          <ProjectDetails />
        </DashboardLayout>
      </Route>
      
      <Route path="/constructions">
        <DashboardLayout>
          <Constructions />
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
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
