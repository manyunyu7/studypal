"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

interface MindmapNodeData {
  label: string;
  content?: string | null;
  color?: string | null;
}

/**
 * Render content that may mix paragraphs and bullet lines.
 * Convention: lines starting with "- " are bullet items; adjacent bullets are
 * grouped into one list. Plain lines render as paragraphs.
 */
function renderContent(content: string) {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key} className="mt-1 space-y-0.5 text-white/80 text-xs leading-relaxed">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-white/50" />
            <span>{b}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
    } else {
      flush(`ul-${i}`);
      blocks.push(
        <p key={`p-${i}`} className="text-white/80 text-xs mt-1 leading-relaxed">
          {line}
        </p>,
      );
    }
  });
  flush("ul-end");
  return blocks;
}

function MindmapNodeComponent({ data }: NodeProps<MindmapNodeData>) {
  const bgColor = data.color ?? "#3f3f46"; // zinc-700 default
  const hasBullets = data.content?.includes("\n- ") ?? false;

  return (
    <>
      {/* Target handle — left side */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground !border-border"
      />

      {/* Card */}
      <div
        className={`rounded-xl border border-white/10 shadow-lg px-4 py-3 min-w-[120px] ${hasBullets ? "max-w-[260px]" : "max-w-[220px]"}`}
        style={{ backgroundColor: bgColor }}
      >
        <p className="text-white text-sm font-bold leading-snug">{data.label}</p>
        {data.content && renderContent(data.content)}
      </div>

      {/* Source handle — right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground !border-border"
      />
    </>
  );
}

export const MindmapNode = memo(MindmapNodeComponent);
