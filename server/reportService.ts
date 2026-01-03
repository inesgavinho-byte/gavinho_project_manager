import type { Project, Task, Order, Budget } from "../drizzle/schema";

export interface ProjectReport {
  project: Project;
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    totalBudget: number;
    actualSpent: number;
    budgetUtilization: number;
    totalOrders: number;
    pendingOrders: number;
    daysRemaining: number | null;
    isDelayed: boolean;
  };
  tasks: Task[];
  orders: Order[];
  budgets: Budget[];
  timeline: Array<{
    date: string;
    progress: number;
    tasksCompleted: number;
  }>;
  budgetTrend: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
}

export interface ComparisonReport {
  projects: Array<{
    id: number;
    name: string;
    progress: number;
    completionRate: number;
    budgetUtilization: number;
    status: string;
    daysRemaining: number | null;
  }>;
  averages: {
    avgProgress: number;
    avgCompletionRate: number;
    avgBudgetUtilization: number;
  };
}

export interface TrendAnalysis {
  period: string;
  projectsStarted: number;
  projectsCompleted: number;
  totalBudget: number;
  totalSpent: number;
  avgCompletionTime: number;
}

export class ReportService {
  /**
   * Generate comprehensive project report
   */
  generateProjectReport(
    project: Project,
    tasks: Task[],
    orders: Order[],
    budgets: Budget[]
  ): ProjectReport {
    const now = new Date();
    const daysRemaining = project.endDate
      ? Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const completedTasks = tasks.filter((t) => t.status === "done");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
    const actualSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);
    const budgetUtilization = totalBudget > 0 ? (actualSpent / totalBudget) * 100 : 0;

    const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "ordered");

    // Calculate if project is delayed
    const expectedProgress = daysRemaining !== null && project.endDate && project.startDate
      ? this.calculateExpectedProgress(new Date(project.startDate), new Date(project.endDate), now)
      : project.progress;
    const isDelayed = project.progress < expectedProgress - 10; // 10% tolerance

    // Generate timeline data (simulated - in real app, track historical data)
    const timeline = this.generateTimelineData(project, tasks);

    // Generate budget trend by category
    const budgetTrend = budgets.map((b) => ({
      category: b.category,
      budgeted: parseFloat(b.budgetedAmount),
      actual: parseFloat(b.actualAmount),
      variance: parseFloat(b.actualAmount) - parseFloat(b.budgetedAmount),
    }));

    return {
      project,
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        completionRate,
        totalBudget,
        actualSpent,
        budgetUtilization,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        daysRemaining,
        isDelayed,
      },
      tasks,
      orders,
      budgets,
      timeline,
      budgetTrend,
    };
  }

  /**
   * Generate comparison report for multiple projects
   */
  generateComparisonReport(
    projects: Project[],
    tasksMap: Map<number, Task[]>,
    budgetsMap: Map<number, Budget[]>
  ): ComparisonReport {
    const projectsData = projects.map((project) => {
      const tasks = tasksMap.get(project.id) || [];
      const budgets = budgetsMap.get(project.id) || [];

      const completedTasks = tasks.filter((t) => t.status === "done").length;
      const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
      const actualSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);
      const budgetUtilization = totalBudget > 0 ? (actualSpent / totalBudget) * 100 : 0;

      const now = new Date();
      const daysRemaining = project.endDate
        ? Math.ceil((new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: project.id,
        name: project.name,
        progress: project.progress,
        completionRate,
        budgetUtilization,
        status: project.status,
        daysRemaining,
      };
    });

    const avgProgress =
      projectsData.reduce((sum, p) => sum + p.progress, 0) / (projectsData.length || 1);
    const avgCompletionRate =
      projectsData.reduce((sum, p) => sum + p.completionRate, 0) / (projectsData.length || 1);
    const avgBudgetUtilization =
      projectsData.reduce((sum, p) => sum + p.budgetUtilization, 0) / (projectsData.length || 1);

    return {
      projects: projectsData,
      averages: {
        avgProgress,
        avgCompletionRate,
        avgBudgetUtilization,
      },
    };
  }

  /**
   * Generate trend analysis over time
   */
  generateTrendAnalysis(
    projects: Project[],
    startDate: Date,
    endDate: Date
  ): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const monthsDiff = this.getMonthsDifference(startDate, endDate);

    for (let i = 0; i <= monthsDiff; i++) {
      const periodStart = new Date(startDate);
      periodStart.setMonth(periodStart.getMonth() + i);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const periodProjects = projects.filter((p) => {
        const projectStart = p.startDate ? new Date(p.startDate) : null;
        return projectStart && projectStart >= periodStart && projectStart < periodEnd;
      });

      const completedProjects = projects.filter((p) => {
        const projectEnd = p.endDate ? new Date(p.endDate) : null;
        return (
          projectEnd &&
          projectEnd >= periodStart &&
          projectEnd < periodEnd &&
          p.status === "completed"
        );
      });

      const totalBudget = periodProjects.reduce((sum, p) => sum + (typeof p.budget === 'number' ? p.budget : 0), 0);

      const avgCompletionTime =
        completedProjects.length > 0
          ? completedProjects.reduce((sum, p) => {
              if (p.startDate && p.endDate) {
                const days =
                  (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) /
                  (1000 * 60 * 60 * 24);
                return sum + days;
              }
              return sum;
            }, 0) / completedProjects.length
          : 0;

      trends.push({
        period: periodStart.toISOString().substring(0, 7), // YYYY-MM
        projectsStarted: periodProjects.length,
        projectsCompleted: completedProjects.length,
        totalBudget,
        totalSpent: totalBudget * 0.85, // Simulated - in real app, track actual spending
        avgCompletionTime,
      });
    }

    return trends;
  }

  /**
   * Calculate expected progress based on timeline
   */
  private calculateExpectedProgress(startDate: Date, endDate: Date, currentDate: Date): number {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();

    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;

    return (elapsed / totalDuration) * 100;
  }

  /**
   * Generate timeline data for project
   */
  private generateTimelineData(
    project: Project,
    tasks: Task[]
  ): Array<{ date: string; progress: number; tasksCompleted: number }> {
    const timeline: Array<{ date: string; progress: number; tasksCompleted: number }> = [];

    if (!project.startDate) return timeline;

    const startDate = new Date(project.startDate);
    const now = new Date();
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Generate weekly data points
    const weeks = Math.min(Math.ceil(daysDiff / 7), 12); // Max 12 weeks

    for (let i = 0; i <= weeks; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 7);

      // Simulate progress (in real app, track historical progress)
      const progress = Math.min((i / weeks) * project.progress, project.progress);

      // Count completed tasks up to this date
      const tasksCompleted = tasks.filter((t) => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt) <= date;
      }).length;

      timeline.push({
        date: date.toISOString().substring(0, 10),
        progress: Math.round(progress),
        tasksCompleted,
      });
    }

    return timeline;
  }

  /**
   * Get months difference between two dates
   */
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    return Math.max(0, months);
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(
    projects: Project[],
    tasksMap: Map<number, Task[]>,
    budgetsMap: Map<number, Budget[]>
  ): {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    totalBudget: number;
    totalSpent: number;
    overallProgress: number;
    criticalIssues: string[];
  } {
    const activeProjects = projects.filter((p) => p.status === "in_progress").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;

    let totalBudget = 0;
    let totalSpent = 0;
    let delayedProjects = 0;
    const criticalIssues: string[] = [];

    projects.forEach((project) => {
      const budgets = budgetsMap.get(project.id) || [];
      const projectBudgetTotal = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
      totalBudget += projectBudgetTotal;
      totalSpent += budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);

      // Check for delays
      if (project.endDate) {
        const now = new Date();
        const daysRemaining = Math.ceil(
          (new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysRemaining < 0 && project.status !== "completed") {
          delayedProjects++;
          criticalIssues.push(`${project.name}: Atrasado ${Math.abs(daysRemaining)} dias`);
        }
      }

      // Check for budget overruns
      const projectBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budgetedAmount), 0);
      const projectSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actualAmount), 0);
      if (projectSpent > projectBudget) {
        criticalIssues.push(
          `${project.name}: Orçamento excedido em €${(projectSpent - projectBudget).toFixed(2)}`
        );
      }
    });

    const overallProgress =
      projects.reduce((sum, p) => sum + p.progress, 0) / (projects.length || 1);

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalBudget,
      totalSpent,
      overallProgress,
      criticalIssues: criticalIssues.slice(0, 5), // Top 5 issues
    };
  }
}

export const reportService = new ReportService();
