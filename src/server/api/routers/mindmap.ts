import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";

const nodeInputSchema = z.object({
  id: z.number().int().optional(),
  label: z.string().min(1),
  content: z.string().optional(),
  posX: z.number(),
  posY: z.number(),
  color: z.string().optional(),
  parentId: z.number().int().optional(),
});

type LayoutNode = {
  id: number;
  label: string;
  content: string | null;
  color: string | null;
  parentId: number | null;
};

const LEVEL_GAP = 340; // horizontal distance between depths
const SIBLING_GAP = 150; // vertical distance between adjacent leaves

/** Tidy tree layout (horizontal, left→right): depth → x, leaf order → y. */
function layout(nodes: LayoutNode[]) {
  const childrenOf = new Map<number, number[]>();
  for (const n of nodes) {
    if (n.parentId != null) {
      const arr = childrenOf.get(n.parentId) ?? [];
      arr.push(n.id);
      childrenOf.set(n.parentId, arr);
    }
  }
  const roots = nodes.filter((n) => n.parentId == null).map((n) => n.id);
  const pos = new Map<number, { x: number; y: number }>();
  let leaf = 0;
  function assign(id: number, depth: number): number {
    const kids = childrenOf.get(id) ?? [];
    let y: number;
    if (kids.length === 0) {
      y = leaf * SIBLING_GAP;
      leaf++;
    } else {
      const kys = kids.map((k) => assign(k, depth + 1));
      y = (kys[0]! + kys[kys.length - 1]!) / 2;
    }
    pos.set(id, { x: depth * LEVEL_GAP, y });
    return y;
  }
  roots.forEach((r) => assign(r, 0));
  return nodes.map((n) => ({ ...n, posX: pos.get(n.id)?.x ?? 0, posY: pos.get(n.id)?.y ?? 0 }));
}

export const mindmapRouter = createTRPCRouter({
  getByTopic: publicProcedure
    .input(z.object({ topicId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mindmapNode.findMany({
        where: { topicId: input.topicId },
        orderBy: { createdAt: "asc" },
      });
    }),

  /**
   * Subject-level concept map: a synthetic root (the subject) with every topic's
   * mindmap hanging beneath it. Positions are recomputed so topics fan out
   * without overlapping. Returns nodes shaped for <MindmapView />.
   */
  getBySubject: publicProcedure
    .input(z.object({ subjectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const [subject, topics] = await Promise.all([
        ctx.db.subject.findUnique({ where: { id: input.subjectId }, select: { name: true } }),
        ctx.db.topic.findMany({
          where: { subjectId: input.subjectId },
          select: { id: true },
          orderBy: { order: "asc" },
        }),
      ]);
      const topicIds = topics.map((t) => t.id);
      const nodes = await ctx.db.mindmapNode.findMany({
        where: { topicId: { in: topicIds } },
        orderBy: [{ topicId: "asc" }, { createdAt: "asc" }],
      });

      const SUBJECT_ID = -1;
      const combined: LayoutNode[] = [
        { id: SUBJECT_ID, label: subject?.name ?? "Mata Kuliah", content: null, color: "#6366f1", parentId: null },
        ...nodes.map((n) => ({
          id: n.id,
          label: n.label,
          content: n.content,
          color: n.color,
          // Each topic root (parentId null) gets re-parented to the subject root.
          parentId: n.parentId ?? SUBJECT_ID,
        })),
      ];

      return layout(combined);
    }),

  saveNodes: adminProcedure
    .input(
      z.object({
        topicId: z.number().int(),
        nodes: z.array(nodeInputSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(async (tx) => {
        // Delete all existing nodes for the topic
        await tx.mindmapNode.deleteMany({ where: { topicId: input.topicId } });

        // Sort: root nodes (no parentId) first, then children
        // Use original index as provided input has nodes ordered by the caller
        // but we must ensure parents are inserted before children
        const roots = input.nodes.filter((n) => !n.parentId);
        const children = input.nodes.filter((n) => !!n.parentId);
        const ordered = [...roots, ...children];

        // Since we deleted all and recreate fresh, we need to track old id -> new id mapping
        // in case parentId references old ids. We build a map as we insert.
        const idMap = new Map<number, number>();

        for (const node of ordered) {
          let resolvedParentId: number | undefined = undefined;
          if (node.parentId !== undefined) {
            // If the parentId was an old id, resolve via map; otherwise use directly
            resolvedParentId = idMap.get(node.parentId) ?? node.parentId;
          }
          const created = await tx.mindmapNode.create({
            data: {
              label: node.label,
              content: node.content,
              posX: node.posX,
              posY: node.posY,
              color: node.color,
              topicId: input.topicId,
              parentId: resolvedParentId ?? null,
            },
          });
          if (node.id !== undefined) {
            idMap.set(node.id, created.id);
          }
        }
      });
    }),
});
