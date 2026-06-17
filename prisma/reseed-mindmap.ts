import { PrismaClient } from "../generated/prisma";
import { readFileSync } from "fs";
import { join } from "path";

// Reseed ONLY the mindmap nodes for one topic from its content JSON.
// Does NOT touch questions, flashcards, or user progress.
// Usage: tsx prisma/reseed-mindmap.ts <content-file.json>

const prisma = new PrismaClient();

type ContentMindmapNode = {
  id: string;
  label: string;
  content?: string;
  parent?: string | null;
  color?: string;
};

const LEVEL_GAP = 340;
const SIBLING_GAP = 150;

function layoutMindmap(nodes: ContentMindmapNode[]) {
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parent) {
      const arr = childrenOf.get(n.parent) ?? [];
      arr.push(n.id);
      childrenOf.set(n.parent, arr);
    }
  }
  const roots = nodes.filter((n) => !n.parent).map((n) => n.id);
  const pos = new Map<string, { x: number; y: number }>();
  let leafCursor = 0;
  function assign(id: string, depth: number): number {
    const kids = childrenOf.get(id) ?? [];
    let y: number;
    if (kids.length === 0) {
      y = leafCursor * SIBLING_GAP;
      leafCursor++;
    } else {
      const kys = kids.map((k) => assign(k, depth + 1));
      y = (kys[0]! + kys[kys.length - 1]!) / 2;
    }
    pos.set(id, { x: depth * LEVEL_GAP, y });
    return y;
  }
  roots.forEach((r) => assign(r, 0));
  const ordered: string[] = [];
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift()!;
    ordered.push(id);
    for (const c of childrenOf.get(id) ?? []) queue.push(c);
  }
  return { pos, ordered };
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx prisma/reseed-mindmap.ts <content-file.json>");
  const data = JSON.parse(readFileSync(join("prisma/content", file), "utf-8")) as {
    topic: string;
    mindmap: ContentMindmapNode[];
  };

  const topic = await prisma.topic.findFirst({ where: { name: data.topic } });
  if (!topic) throw new Error(`Topic "${data.topic}" not found in DB`);

  await prisma.mindmapNode.updateMany({ where: { topicId: topic.id }, data: { parentId: null } });
  await prisma.mindmapNode.deleteMany({ where: { topicId: topic.id } });

  const byId = new Map(data.mindmap.map((n) => [n.id, n]));
  const { pos, ordered } = layoutMindmap(data.mindmap);
  const localToDb = new Map<string, number>();
  for (const localId of ordered) {
    const n = byId.get(localId)!;
    const p = pos.get(localId)!;
    const created = await prisma.mindmapNode.create({
      data: {
        label: n.label,
        content: n.content,
        color: n.color,
        posX: p.x,
        posY: p.y,
        topicId: topic.id,
        parentId: n.parent ? (localToDb.get(n.parent) ?? null) : null,
      },
    });
    localToDb.set(localId, created.id);
  }

  console.log(`${data.topic}: ${data.mindmap.length} mindmap node di-reseed (topicId ${topic.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
