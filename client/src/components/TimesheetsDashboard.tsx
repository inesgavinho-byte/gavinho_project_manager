import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Clock, TrendingUp, Briefcase, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

const COLORS = ["#C9A882", "#5F5C59", "#C3BAAF", "#EEEAE5", "#8B7355"];

export default function TimesheetsDashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");
  
  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };
  
  const dateRange = getDateRange();
  
  const { data: stats } = trpc.hr.timesheets.stats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  
  const { data: byProject } = trpc.hr.timesheets.byProject.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  
  const { data: byMonth } = trpc.hr.timesheets.byMonth.useQuery({
    months: period === "year" ? 12 : period === "quarter" ? 3 : period === "month" ? 1 : 1,
  });
  
  // Calculate average daily hours
  const avgDailyHours = stats?.totalHours 
    ? (stats.totalHours / Math.max(stats.totalEntries, 1)).toFixed(1)
    : "0.0";
  
  // Format month data for chart
  const monthChartData = byMonth?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
    total: Number(item.totalHours),
    aprovadas: Number(item.approvedHours),
  })) || [];
  
  // Format project data for pie chart
  const projectChartData = byProject?.slice(0, 5).map(item => ({
    name: item.projectCode || 'Sem código',
    value: Number(item.totalHours),
  })) || [];
  
  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#5F5C59]">Dashboard de Horas</h2>
          <p className="text-sm text-[#5F5C59]/60">Análise de distribuição de horas trabalhadas</p>
        </div>
        
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{stats?.totalHours || 0}h</div>
            <p className="text-xs text-[#5F5C59]/60 mt-1">
              {stats?.approvedHours || 0}h aprovadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">Projetos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{stats?.uniqueProjects || 0}</div>
            <p className="text-xs text-[#5F5C59]/60 mt-1">
              {stats?.totalEntries || 0} registos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">Média Diária</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{avgDailyHours}h</div>
            <p className="text-xs text-[#5F5C59]/60 mt-1">
              por registo
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#5F5C59]">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-[#C9A882]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{stats?.pendingHours || 0}h</div>
            <p className="text-xs text-[#5F5C59]/60 mt-1">
              aguardam aprovação
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-[#5F5C59]">Evolução Mensal</CardTitle>
            <CardDescription>Comparação de horas totais e aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEEAE5" />
                <XAxis dataKey="month" stroke="#5F5C59" fontSize={12} />
                <YAxis stroke="#5F5C59" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #EEEAE5',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#C9A882" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aprovadas" name="Aprovadas" fill="#5F5C59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Project Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-[#5F5C59]">Distribuição por Projeto</CardTitle>
            <CardDescription>Top 5 projetos com mais horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #EEEAE5',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${value}h`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-[#5F5C59]">Detalhes por Projeto</CardTitle>
          <CardDescription>Resumo de horas por projeto no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byProject?.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-[#EEEAE5] hover:bg-[#EEEAE5]/30 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-[#5F5C59]">{project.projectCode}</p>
                  <p className="text-sm text-[#5F5C59]/60">{project.projectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[#C9A882]">{project.totalHours}h</p>
                  <p className="text-xs text-[#5F5C59]/60">{project.entries} registos</p>
                </div>
              </div>
            ))}
            
            {(!byProject || byProject.length === 0) && (
              <div className="text-center py-8 text-[#5F5C59]/60">
                Nenhum registo de horas no período selecionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
