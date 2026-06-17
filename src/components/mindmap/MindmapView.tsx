"use client";

import { useMemo } from "react";
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { MindmapNode } from "~/components/mindmap/MindmapNode";

interface MindmapNodeData {
  id: number;
  label: string;
  content?: string | null;
  posX: number;
  posY: number;
  color?: string | null;
  parentId?: number | null;
}

interface MindmapViewProps {
  nodes: MindmapNodeData[];
}

const nodeTypes = {
  mindmapNode: MindmapNode,
};

export function MindmapView({ nodes }: MindmapViewProps) {
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: String(n.id),
        position: { x: n.posX, y: n.posY },
        data: {
          label: n.label,
          content: n.content,
          color: n.color,
        },
        type: "mindmapNode",
      })),
    [nodes],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      nodes
        .filter((n) => n.parentId != null)
        .map((n) => ({
          id: `e${n.parentId}-${n.id}`,
          source: String(n.parentId),
          target: String(n.id),
          type: "smoothstep",
          pathOptions: { borderRadius: 16 },
          style: { stroke: "#52525b", strokeWidth: 1.5 },
        })),
    [nodes],
  );

  return (
    <div
      className="w-full bg-card rounded-xl overflow-hidden border border-border"
      style={{ height: "75vh", minHeight: 500 }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-card"
      >
        <Background color="#3f3f46" variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="[&>button]:bg-accent [&>button]:border-border [&>button]:text-foreground [&>button:hover]:bg-muted" />
        <MiniMap
          nodeColor={(n) => (n.data as { color?: string | null }).color ?? "#3f3f46"}
          maskColor="rgba(9,9,11,0.7)"
          className="!bg-accent !border-border"
        />
      </ReactFlow>
    </div>
  );
}
