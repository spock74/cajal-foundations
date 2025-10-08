/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  NodeChange,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre'; 
import { AlertCircle, Expand, Minimize2, ChevronRight, ChevronDown } from 'lucide-react';

interface MindMapDisplayProps {
  isLoading: boolean;
  error: string | null;
  nodes: any[];
  edges: any[];
  expandedNodeIds?: string[];
  nodePositions?: { [nodeId: string]: { x: number; y: number } };
  onLayoutChange: (layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 50, // Aumenta a separação vertical entre nós no mesmo nível
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

  return { nodes, edges };
};

// Nó customizado que inclui o botão para expandir/recolher.
const CustomMindMapNode = React.memo(({ id, data }: { id: string, data: any }) => {
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
          onClick={() => data.handleToggleNode(id)}
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

// Otimização: Definir nodeTypes fora do componente para evitar recriações.
const nodeTypes = { mindMapNode: CustomMindMapNode }; 

const MindMapDisplay: React.FC<MindMapDisplayProps> = ({
  isLoading,
  error,
  nodes: rawNodes,
  edges: rawEdges,
  expandedNodeIds = [],
  nodePositions = {},
  onLayoutChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { fitView } = useReactFlow();
  
  // 1. Calcula a hierarquia (mapa de filhos) e encontra o nó raiz.
  const handleToggleNode = useCallback((nodeId: string) => {
    const newExpandedSet = new Set(expandedNodeIds);
    if (newExpandedSet.has(nodeId)) {
      newExpandedSet.delete(nodeId);
    } else {
      newExpandedSet.add(nodeId);
    }
    onLayoutChange({ expandedNodeIds: Array.from(newExpandedSet) });
  }, [onLayoutChange, expandedNodeIds]);

  // 2. Calcula a hierarquia (mapa de filhos) e encontra o nó raiz.
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

  // Efeito para reajustar a visão ao redimensionar a janela.
  useEffect(() => {
    const handleResize = () => {
      fitView({ duration: 200 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);

  // 3. Efeito principal que calcula os nós e arestas visíveis e o layout.
  useEffect(() => {
    if (!rootNode) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const expandedSet = new Set(expandedNodeIds);

    // Lógica para determinar quais nós são visíveis com base no estado de expansão.
    const visibleNodes: any[] = [];
    const q = [{ node: rootNode, depth: 0 }];
    const visited = new Set([rootNode.id]);
    
    while (q.length > 0) {
      const { node: currentNode, depth } = q.shift()!;
      visibleNodes.push({ ...currentNode, depth });

      if (expandedSet.has(currentNode.id)) {
        const children = childrenMap.get(currentNode.id) || [];
        children.forEach((childId: string) => {
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

    // Memoize a criação dos nós para evitar recriações desnecessárias do objeto 'data'
    const getAugmentedNodes = () => visibleNodes.map(node => {
        const estimatedHeight = 40 + Math.floor((node.label || '').length / 25) * 15;
        return {
            ...node,
            type: 'mindMapNode',
            width: 180,
            height: estimatedHeight,
            data: {
                ...node.data,
                label: node.label || node.data?.label,
                isExpanded: expandedSet.has(node.id),
                hasChildren: (childrenMap.get(node.id) || []).length > 0,
                handleToggleNode: handleToggleNode,
                depth: node.depth,
            }
        };
    });

    const augmentedNodes = getAugmentedNodes();

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(augmentedNodes, visibleEdges);
    
    // Aplica posições salvas sobre as posições calculadas pelo layout.
    const finalNodes = layoutedNodes.map(node => ({
      ...node,
      position: nodePositions[node.id] || node.position, // NOSONAR
    }));
    setNodes(finalNodes);

    const edgeColor = '#A8ABB4'; // Mantido para consistência
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

  }, [rootNode, rawNodes, rawEdges, childrenMap, expandedNodeIds, fitView, nodePositions, setNodes, setEdges, handleToggleNode]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    const newPositions = { ...nodePositions };
    let hasPositionChanged = false;
    changes.forEach((change: NodeChange) => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        newPositions[change.id] = { x: change.position.x, y: change.position.y };
        hasPositionChanged = true;
      }
    });
    if (hasPositionChanged) onLayoutChange({ nodePositions: newPositions });
  }, [onNodesChange, nodePositions, onLayoutChange]);

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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          fitView={true}
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