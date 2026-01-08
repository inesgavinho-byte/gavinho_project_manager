import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface NetworkGraphProps {
  projects: Array<{ id: number; code: string; name: string; status: string }>;
  clients: Array<{ id: number; name: string }>;
  suppliers: Array<{ id: number; name: string }>;
  clientProjectLinks: Array<{ clientId: number; projectId: number }>;
  supplierProjectLinks: Array<{ supplierId: number; projectId: number }>;
}

export default function NetworkGraph({
  projects,
  clients,
  suppliers,
  clientProjectLinks,
  supplierProjectLinks,
}: NetworkGraphProps) {
  // Criar nós para projetos (centro)
  const projectNodes: Node[] = projects.map((project, index) => ({
    id: `project-${project.id}`,
    type: 'default',
    data: { 
      label: `${project.code}\n${project.name}`,
    },
    position: { x: 400, y: index * 150 + 100 },
    style: {
      background: '#c4a574',
      color: '#fff',
      border: '2px solid #a08560',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      fontWeight: 600,
      width: 180,
      textAlign: 'center',
    },
  }));

  // Criar nós para clientes (esquerda)
  const clientNodes: Node[] = clients.map((client, index) => ({
    id: `client-${client.id}`,
    type: 'default',
    data: { label: client.name },
    position: { x: 50, y: index * 120 + 100 },
    style: {
      background: '#e8b4b8',
      color: '#5a3a3c',
      border: '2px solid #d49499',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '11px',
      fontWeight: 500,
      width: 150,
      textAlign: 'center',
    },
  }));

  // Criar nós para fornecedores (direita)
  const supplierNodes: Node[] = suppliers.map((supplier, index) => ({
    id: `supplier-${supplier.id}`,
    type: 'default',
    data: { label: supplier.name },
    position: { x: 750, y: index * 120 + 100 },
    style: {
      background: '#9eb8d9',
      color: '#2c3e50',
      border: '2px solid #7a9cc6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '11px',
      fontWeight: 500,
      width: 150,
      textAlign: 'center',
    },
  }));

  // Combinar todos os nós
  const initialNodes = [...projectNodes, ...clientNodes, ...supplierNodes];

  // Criar edges para clientes-projetos
  const clientEdges: Edge[] = clientProjectLinks.map((link, index) => ({
    id: `client-edge-${index}`,
    source: `client-${link.clientId}`,
    target: `project-${link.projectId}`,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#e8b4b8', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#e8b4b8',
    },
  }));

  // Criar edges para fornecedores-projetos
  const supplierEdges: Edge[] = supplierProjectLinks.map((link, index) => ({
    id: `supplier-edge-${index}`,
    source: `project-${link.projectId}`,
    target: `supplier-${link.supplierId}`,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9eb8d9', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#9eb8d9',
    },
  }));

  // Combinar todos os edges
  const initialEdges = [...clientEdges, ...supplierEdges];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [, setLocation] = useLocation();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Handler para click em nós
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    
    // Navegar para página de detalhes
    if (node.id.startsWith('project-')) {
      const projectId = node.id.replace('project-', '');
      setLocation(`/projects/${projectId}`);
    } else if (node.id.startsWith('client-')) {
      const clientId = node.id.replace('client-', '');
      // Navegar para clientes (quando implementado)
      console.log('Cliente clicado:', clientId);
    } else if (node.id.startsWith('supplier-')) {
      const supplierId = node.id.replace('supplier-', '');
      // Navegar para fornecedores (quando implementado)
      console.log('Fornecedor clicado:', supplierId);
    }
  }, [setLocation]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
