import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

interface MQTDataTableProps {
  projectId: number;
}

type SortField = 'itemCode' | 'variance' | 'variancePercentage' | 'status';
type SortOrder = 'asc' | 'desc';

export function MQTDataTable({ projectId }: MQTDataTableProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_track' | 'warning' | 'critical'>(
    'all'
  );
  const [sortField, setSortField] = useState<SortField>('variancePercentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: mqtData, isLoading } = trpc.mq.getMQTData.useQuery({
    projectId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return 'text-green-600'; // Excesso
    return 'text-red-600'; // Falta
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-30" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  let filteredData = mqtData || [];

  if (statusFilter !== 'all') {
    filteredData = filteredData.filter((item) => item.status === statusFilter);
  }

  // Sort data
  filteredData = [...filteredData].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case 'itemCode':
        aVal = a.itemCode || '';
        bVal = b.itemCode || '';
        break;
      case 'variance':
        aVal = a.variance || 0;
        bVal = b.variance || 0;
        break;
      case 'variancePercentage':
        aVal = a.variancePercentage || 0;
        bVal = b.variancePercentage || 0;
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }

    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados MQT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dados MQT</CardTitle>
            <CardDescription>{filteredData.length} itens</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="on_track">No Caminho</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('itemCode')}
                >
                  <div className="flex items-center gap-2">
                    Código
                    <SortIcon field="itemCode" />
                  </div>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Planejado</TableHead>
                <TableHead className="text-right">Executado</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted text-right"
                  onClick={() => handleSort('variance')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Variância
                    <SortIcon field="variance" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted text-right"
                  onClick={() => handleSort('variancePercentage')}
                >
                  <div className="flex items-center justify-end gap-2">
                    %
                    <SortIcon field="variancePercentage" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.itemCode}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.itemDescription}</TableCell>
                    <TableCell className="text-right">
                      {item.plannedQuantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.executedQuantity} {item.unit}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getVarianceColor(item.variance || 0)}`}>
                      {item.variance && item.variance > 0 ? '+' : ''}
                      {item.variance} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          (item.variancePercentage || 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {item.variancePercentage && item.variancePercentage > 0 ? '+' : ''}
                        {item.variancePercentage?.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status || 'on_track')}
                        <Badge className={getStatusColor(item.status || 'on_track')}>
                          {item.status === 'on_track' && 'No Caminho'}
                          {item.status === 'warning' && 'Aviso'}
                          {item.status === 'critical' && 'Crítico'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
