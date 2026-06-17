"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

type MindmapNode = {
  id: number;
  label: string;
  content: string | null;
  posX: number;
  posY: number;
  color: string | null;
  parentId: number | null;
  topicId: number;
};

function nodeToRF(node: MindmapNode): Node {
  return {
    id: String(node.id),
    position: { x: node.posX, y: node.posY },
    data: {
      label: node.label,
      content: node.content,
      color: node.color,
      dbId: node.id,
    },
    style: {
      background: node.color ?? "#3730a3",
      color: "#fff",
      border: "1px solid #6366f1",
      borderRadius: "8px",
      padding: "8px 14px",
      minWidth: 120,
      fontWeight: 600,
    },
  };
}

function nodesToEdges(nodes: MindmapNode[]): Edge[] {
  return nodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      id: `e${n.parentId}-${n.id}`,
      source: String(n.parentId),
      target: String(n.id),
      style: { stroke: "#6366f1" },
    }));
}

let tempIdCounter = -1;
function nextTempId() {
  return tempIdCounter--;
}

function AddNodeDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (data: { label: string; content: string; color: string }) => void;
}) {
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#3730a3");

  function handleOpen(v: boolean) {
    if (v) {
      setLabel("");
      setContent("");
      setColor("#3730a3");
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Tambah Node</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Label</label>
            <Input
              className="border-border bg-accent text-foreground"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nama node..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Konten (opsional)</label>
            <Textarea
              className="border-border bg-accent text-foreground"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Penjelasan atau detail..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Warna</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded border border-border bg-accent"
              />
              <span className="font-mono text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            disabled={!label.trim()}
            onClick={() => {
              onAdd({ label: label.trim(), content: content.trim(), color });
              onOpenChange(false);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MindmapPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const tId = parseInt(topicId, 10);
  const router = useRouter();

  const { data: savedNodes, isLoading } = api.mindmap.getByTopic.useQuery({
    topicId: tId,
  });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load saved nodes into ReactFlow state
  useEffect(() => {
    if (savedNodes) {
      setNodes(savedNodes.map(nodeToRF));
      setEdges(nodesToEdges(savedNodes));
    }
  }, [savedNodes]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, style: { stroke: "#6366f1" } }, eds),
      );
    },
    [],
  );

  function handleAddNode(data: { label: string; content: string; color: string }) {
    const tempId = nextTempId();
    const newNode: Node = {
      id: String(tempId),
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: data.label,
        content: data.content,
        color: data.color,
        dbId: tempId,
      },
      style: {
        background: data.color,
        color: "#fff",
        border: "1px solid #6366f1",
        borderRadius: "8px",
        padding: "8px 14px",
        minWidth: 120,
        fontWeight: 600,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  const saveMut = api.mindmap.saveNodes.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  function handleSave() {
    setSaveStatus("saving");

    // Build parent map from edges
    const parentMap = new Map<string, string>();
    edges.forEach((edge) => {
      parentMap.set(edge.target, edge.source);
    });

    // Build a map from temp/string node id -> index for ordering
    const idIndexMap = new Map<string, number>();
    nodes.forEach((n, i) => idIndexMap.set(n.id, i));

    // Convert nodes to save format
    // We use the dbId stored in data if it's positive (existing), else undefined
    const nodesPayload = nodes.map((n) => {
      const dbId = typeof n.data.dbId === "number" && n.data.dbId > 0 ? n.data.dbId : undefined;
      const parentStrId = parentMap.get(n.id);
      let parentDbId: number | undefined = undefined;
      if (parentStrId) {
        const parentNode = nodes.find((pn) => pn.id === parentStrId);
        if (parentNode) {
          parentDbId =
            typeof parentNode.data.dbId === "number" && parentNode.data.dbId > 0
              ? (parentNode.data.dbId as number)
              : undefined;
        }
      }
      return {
        id: dbId,
        label: String(n.data.label ?? ""),
        content: n.data.content ? String(n.data.content) : undefined,
        posX: n.position.x,
        posY: n.position.y,
        color: n.data.color ? String(n.data.color) : undefined,
        parentId: parentDbId,
      };
    });

    saveMut.mutate({ topicId: tId, nodes: nodesPayload });
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Memuat mindmap...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </Button>
        <div className="flex-1">
          <span className="font-bold text-foreground">Mindmap Editor</span>
          <span className="ml-2 text-sm text-muted-foreground">Topic ID: {tId}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => setAddOpen(true)}
          className="border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
        >
          + Tambah Node
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={
            saveStatus === "saved"
              ? "bg-green-600 hover:bg-green-700"
              : saveStatus === "error"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          }
        >
          {saveStatus === "saving"
            ? "Menyimpan..."
            : saveStatus === "saved"
              ? "Tersimpan!"
              : saveStatus === "error"
                ? "Error!"
                : "Simpan"}
        </Button>
      </div>

      {/* ReactFlow canvas */}
      <div className="flex-1 bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} color="#374151" gap={20} />
          <Controls className="[&>button]:border-border [&>button]:bg-accent [&>button]:text-foreground" />
          <MiniMap
            className="!bg-card"
            nodeColor={(n) => (n.data.color as string) ?? "#3730a3"}
          />
        </ReactFlow>
      </div>

      <AddNodeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAddNode}
      />
    </div>
  );
}
