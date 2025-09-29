/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
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

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const MindMapModal: React.FC<MindMapModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  title,
  nodes: rawNodes,
  edges: rawEdges,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (rawNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rawNodes,
        rawEdges
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges.map(edge => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed } })));
    }
  }, [rawNodes, rawEdges, setNodes, setEdges]);
  
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
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
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