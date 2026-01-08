import { useState } from 'react';
import { trpc } from '../lib/trpc';
import NetworkGraph from '../components/NetworkGraph';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Network, Users, Building2, Link as LinkIcon, Filter } from 'lucide-react';

export default function RelationshipsDashboard() {
  const [showProjects, setShowProjects] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const [showSuppliers, setShowSuppliers] = useState(true);

  const { data: networkData, isLoading: loadingNetwork } = trpc.relationships.getNetworkData.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.relationships.getStats.useQuery();

  if (loadingNetwork || loadingStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar dados de relacionamentos...</p>
        </div>
      </div>
    );
  }

  if (!networkData || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado de relacionamentos disponível</p>
      </div>
    );
  }

  // Filtrar dados baseado nos toggles
  const filteredProjects = showProjects ? networkData.projects : [];
  const filteredClients = showClients ? networkData.clients : [];
  const filteredSuppliers = showSuppliers ? networkData.suppliers : [];

  // Filtrar links baseado nos nós visíveis
  const projectIds = new Set(filteredProjects.map(p => p.id));
  const clientIds = new Set(filteredClients.map(c => c.id));
  const supplierIds = new Set(filteredSuppliers.map(s => s.id));

  const filteredClientLinks = networkData.clientProjectLinks.filter(
    link => showClients && showProjects && clientIds.has(link.clientId) && projectIds.has(link.projectId)
  );

  const filteredSupplierLinks = networkData.supplierProjectLinks.filter(
    link => showSuppliers && showProjects && supplierIds.has(link.supplierId) && projectIds.has(link.projectId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Relacionamentos</h1>
        <p className="text-muted-foreground">
          Visualização de rede de conexões entre projetos, clientes e fornecedores
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#c4a574]/10">
              <Building2 className="h-6 w-6 text-[#c4a574]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projetos</p>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#e8b4b8]/10">
              <Users className="h-6 w-6 text-[#e8b4b8]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold">{stats.totalClients}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#9eb8d9]/10">
              <Network className="h-6 w-6 text-[#9eb8d9]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fornecedores</p>
              <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conexões</p>
              <p className="text-2xl font-bold">{stats.totalConnections}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showProjects ? "default" : "outline"}
              size="sm"
              onClick={() => setShowProjects(!showProjects)}
              style={{
                backgroundColor: showProjects ? '#c4a574' : 'transparent',
                borderColor: '#c4a574',
                color: showProjects ? '#fff' : '#c4a574',
              }}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Projetos
            </Button>
            <Button
              variant={showClients ? "default" : "outline"}
              size="sm"
              onClick={() => setShowClients(!showClients)}
              style={{
                backgroundColor: showClients ? '#e8b4b8' : 'transparent',
                borderColor: '#e8b4b8',
                color: showClients ? '#fff' : '#e8b4b8',
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </Button>
            <Button
              variant={showSuppliers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSuppliers(!showSuppliers)}
              style={{
                backgroundColor: showSuppliers ? '#9eb8d9' : 'transparent',
                borderColor: '#9eb8d9',
                color: showSuppliers ? '#fff' : '#9eb8d9',
              }}
            >
              <Network className="h-4 w-4 mr-2" />
              Fornecedores
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico de Rede */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Gráfico de Rede</h2>
          <p className="text-sm text-muted-foreground">
            Visualização interativa das conexões. Use o scroll para zoom e arraste para navegar.
          </p>
        </div>
        <NetworkGraph
          projects={filteredProjects}
          clients={filteredClients}
          suppliers={filteredSuppliers}
          clientProjectLinks={filteredClientLinks}
          supplierProjectLinks={filteredSupplierLinks}
        />
      </Card>

      {/* Legenda */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#c4a574' }}></div>
            <div>
              <p className="font-medium">Projetos</p>
              <p className="text-sm text-muted-foreground">Centro da rede</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#e8b4b8' }}></div>
            <div>
              <p className="font-medium">Clientes</p>
              <p className="text-sm text-muted-foreground">Lado esquerdo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#9eb8d9' }}></div>
            <div>
              <p className="font-medium">Fornecedores</p>
              <p className="text-sm text-muted-foreground">Lado direito</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
