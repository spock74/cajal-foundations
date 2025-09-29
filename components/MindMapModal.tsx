/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import dagre from 'dagre';
import { X, AlertCircle } from 'lucide-react';

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  title: string;
  nodes: any[];
  edges: any[];
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 40;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 25,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Left;
    node.sourcePosition = Position.Right;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

// Custom Node Component
const MindMapNode = React.memo(({ data }: { data: any }) => {
  return (
    <div className="mindmap-node-content">
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span>{data.label}</span>
      {data.hasChildren && (
        <button onClick={data.onToggle} className="mindmap-node-toggle" aria-label={data.isExpanded ? 'Collapse node' : 'Expand node'}>
          {data.isExpanded ? '<' : '>'}
        </button>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
});

const nodeTypes = { mindMapNode: MindMapNode };

const MindMapModal: React.FC<MindMapModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  title,
  nodes: rawNodes,
  edges: rawEdges,
}) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set<string>());

  // Reset expansion state when the underlying data changes
  useEffect(() => {
    setExpandedNodes(new Set());
  }, [rawNodes]);
  
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

  const { childrenMap, rootNode } = useMemo(() => {
    if (rawNodes.length === 0) return { childrenMap: new Map(), rootNode: null };
    
    const childrenMap = new Map<string, string[]>();
    rawEdges.forEach(edge => {
      if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
      childrenMap.get(edge.source)!.push(edge.target);
    });

    const root = rawNodes.find(n => !rawEdges.some(e => e.target === n.id)) || rawNodes[0];
    return { childrenMap, rootNode: root };
  }, [rawNodes, rawEdges]);
  
  useEffect(() => {
    if (!rootNode) {
      setNodes([]);
      setEdges([]);
      return;
    }

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

    const augmentedNodes = visibleNodes.map(node => ({
      ...node,
      type: 'mindMapNode',
      className: `depth-${node.depth % 4}`,
      data: {
        ...node.data,
        isExpanded: expandedNodes.has(node.id),
        hasChildren: (childrenMap.get(node.id) || []).length > 0,
        onToggle: () => handleToggleNode(node.id),
      }
    }));
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(augmentedNodes, visibleEdges);
    
    setNodes(layoutedNodes);

    const edgeColor = '#A8ABB4';
    setEdges(layoutedEdges.map((edge: any) => ({
      ...edge,
      type: 'smoothstep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      style: {
        stroke: edgeColor,
        strokeWidth: 1,
      },
    })));

  }, [rootNode, childrenMap, rawNodes, rawEdges, expandedNodes, handleToggleNode]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mind-map-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mindmap-title">
      <div className="mind-map-modal-content">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
          <h2 id="mindmap-title" className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors"
            aria-label="Close Mind Map"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-grow w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#1E1E1E]/80 z-10">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-white">Analyzing text and building graph...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#1E1E1E]/80 z-10 p-6">
               <AlertCircle size={32} className="text-[#f87171] mb-3" />
               <p className="text-lg font-semibold text-white mb-1">Failed to create Mind Map</p>
               <p className="text-sm text-center text-[#A8ABB4]">{error}</p>
            </div>
          )}
          {!isLoading && !error && rawNodes.length > 0 && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMapModal;
