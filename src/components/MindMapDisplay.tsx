/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre'; 
import { AlertCircle, Expand, Minimize2, ChevronRight, ChevronDown } from 'lucide-react';

interface MindMapDisplayProps {
  isLoading: boolean;
  error: string | null;
  nodes: any[];
  edges: any[];
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 30, // Aumenta a separação vertical entre nós no mesmo nível
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.width, height: node.height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - node.width / 2,
      y: nodeWithPosition.y - node.height / 2,
    };
    return node;
  });

  // Etapa extra para centralizar os filhos verticalmente em relação ao pai.
  const childrenMap = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
    childrenMap.get(edge.source)!.push(edge.target);
  });

  nodes.forEach(parent => {
    const childIds = childrenMap.get(parent.id);
    if (childIds && childIds.length > 1) {
      const childNodes = childIds.map(id => nodes.find(n => n.id === id)).filter(n => n);
      const totalChildHeight = childNodes.reduce((sum, n) => sum + n.height + 30, 0) - 30; // 30 é o nodesep
      const firstChildY = parent.position.y - totalChildHeight / 2 + parent.height / 2;
      let currentY = firstChildY;
      childNodes.forEach(child => {
        child.position.y = currentY;
        currentY += child.height + 30;
      });
    }
  });

  return { nodes, edges };
};

// Nó customizado que inclui o botão para expandir/recolher.
const CustomMindMapNode = React.memo(({ data }: { data: any }) => {
  // Define uma cor baseada na profundidade do nó.
  const depthColors = [
    'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
    'bg-green-500/10 dark:bg-green-500/20 border-green-500/30',
    'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30',
    'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30',
  ];
  const colorClass = depthColors[data.depth % depthColors.length] || depthColors[0];
  return (
    <div className={`rounded-md p-2 relative text-center flex items-center justify-center border-2 ${colorClass}`} style={{ minHeight: 40 }}>
      <Handle type="target" position={Position.Left} isConnectable={false} className="!bg-transparent" />
      <span className="text-xs font-medium text-gray-800 dark:text-gray-100" style={{ maxWidth: 180 }}>{data.label}</span>
      {data.hasChildren && (
        <button
          onClick={data.onToggle}
          className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-600 dark:bg-gray-300 text-white dark:text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          aria-label={data.isExpanded ? 'Recolher nó' : 'Expandir nó'}
        >
          {data.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} className="!bg-transparent" />
    </div>
  );
});

// Registra o nó customizado para que o ReactFlow possa usá-lo.
const nodeTypes = { mindMapNode: CustomMindMapNode };

const MindMapDisplay: React.FC<MindMapDisplayProps> = ({
  isLoading,
  error,
  nodes: rawNodes,
  edges: rawEdges,
}) => {
  const [nodes, setNodes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set<string>());
  const [edges, setEdges] = useState([]);
  const { fitView } = useReactFlow();
  
  // 1. Calcula a hierarquia (mapa de filhos) e encontra o nó raiz.
  const { childrenMap, rootNode } = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) return { childrenMap: new Map(), rootNode: null };
    
    const childrenMap = new Map<string, string[]>();
    rawEdges.forEach(edge => {
      if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
      childrenMap.get(edge.source)!.push(edge.target);
    });

    const root = rawNodes.find(n => !rawEdges.some(e => e.target === n.id)) || rawNodes[0];
    return { childrenMap, rootNode: root };
  }, [rawNodes, rawEdges]);

  // 2. Inicializa o estado de expansão quando os dados mudam, mostrando apenas o 1º nível.
  useEffect(() => {
    if (rootNode) {
      setExpandedNodes(new Set([rootNode.id]));
    } else {
      setExpandedNodes(new Set());
    }
  }, [rootNode]);

  // Efeito para reajustar a visão ao redimensionar a janela.
  useEffect(() => {
    const handleResize = () => {
      fitView({ duration: 200 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);

  const handleToggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);
  
  // 3. Efeito principal que calcula os nós e arestas visíveis e o layout.
  useEffect(() => {
    if (!rootNode || !rawNodes) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Lógica para determinar quais nós são visíveis com base no estado de expansão.
    const visibleNodes: any[] = [];
    const q = [{ node: rootNode, depth: 0 }];
    const visited = new Set([rootNode.id]);
    
    while (q.length > 0) {
      const { node: currentNode, depth } = q.shift()!;
      visibleNodes.push({ ...currentNode, depth });

      if (expandedNodes.has(currentNode.id)) {
        const children = childrenMap.get(currentNode.id) || [];
        children.forEach(childId => {
          if (!visited.has(childId)) {
            const childNode = rawNodes.find(n => n.id === childId);
            if (childNode) {
              visited.add(childId);
              q.push({ node: childNode, depth: depth + 1 });
            }
          }
        });
      }
    }

    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = rawEdges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

    const augmentedNodes = visibleNodes.map(node => {
      // Estimar altura baseada no comprimento do texto para um layout mais preciso.
      const estimatedHeight = 40 + Math.floor((node.label || '').length / 25) * 15;
      return {
      ...node,
      type: 'mindMapNode', // Usa nosso nó customizado.
      width: 180,
      height: estimatedHeight,
      data: {
        ...node.data,
        label: node.label || node.data.label,
        isExpanded: expandedNodes.has(node.id),
        hasChildren: (childrenMap.get(node.id) || []).length > 0,
        onToggle: () => handleToggleNode(node.id),
        depth: node.depth,
      }
    }});
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(augmentedNodes, visibleEdges);
    
    setNodes(layoutedNodes);

    const edgeColor = '#A8ABB4';
    setEdges(layoutedEdges.map((edge: any) => ({
      ...edge,
      type: 'default', // Curvas de Bézier, mais suaves.
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: {
        stroke: edgeColor,
        strokeWidth: 1.5,
      },
    })));

    setTimeout(() => fitView({ duration: 400 }), 50);

  }, [rootNode, rawNodes, rawEdges, childrenMap, expandedNodes, handleToggleNode, fitView]);

  const containerClasses = isExpanded
    ? "fixed inset-0 z-50 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-sm p-4 flex flex-col"
    : "w-full h-[400px] bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.1)] relative mt-2";

  return (
    <div className={containerClasses}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-3 right-3 z-20 p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        title={isExpanded ? "Minimizar Mapa Mental" : "Expandir Mapa Mental"}
      >
        {isExpanded ? <Minimize2 size={18} /> : <Expand size={18} />}
      </button>

      <div className={`w-full h-full relative ${isExpanded ? 'flex-grow' : ''}`}>

      {isLoading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-[#1E1E1E]/80 z-10 rounded-lg">
          <div className="w-8 h-8 border-4 border-gray-500 dark:border-white border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-800 dark:text-white">Analisando texto e construindo o gráfico...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-[#1E1E1E]/80 z-10 p-6 rounded-lg">
           <AlertCircle size={32} className="text-red-500 dark:text-[#f87171] mb-3" />
           <p className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Falha ao criar o Mapa Mental</p>
           <p className="text-sm text-center text-gray-600 dark:text-[#A8ABB4]">{error}</p>
        </div>
      )}
      {!isLoading && !error && rawNodes.length > 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true} // Arrastar e soltar agora funciona como esperado.
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background gap={16} size={1} />
        </ReactFlow>
      )}
      </div>
    </div>
  );
};

// O ReactFlow precisa ser envolvido por um Provider para que o hook `useReactFlow` funcione.
const MindMapWrapper: React.FC<MindMapDisplayProps> = (props) => (
  <ReactFlowProvider>
    <MindMapDisplay {...props} />
  </ReactFlowProvider>
);

export default MindMapWrapper;