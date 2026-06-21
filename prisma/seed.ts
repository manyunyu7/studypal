import { PrismaClient, type Difficulty } from "../generated/prisma";
import bcrypt from "bcryptjs";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// ── Content file types (prisma/content/*.json) ──────────────────────────────
type ContentOption = { text: string; isCorrect: boolean };
type ContentQuestion = {
  text: string;
  explanation?: string;
  difficulty?: Difficulty;
  tag?: string;
  options: ContentOption[];
};
type ContentFlashcard = { front: string; back: string; tag?: string };
type ContentMindmapNode = {
  id: string;
  label: string;
  content?: string;
  parent?: string | null;
  color?: string;
};
type ContentFile = {
  topic: string;
  order: number;
  description?: string;
  questions: ContentQuestion[];
  flashcards: ContentFlashcard[];
  mindmap: ContentMindmapNode[];
};

// Each subject lives in its own subfolder under prisma/content/.
// The folder's `_subject.json` describes the subject + its semester;
// every other *.json in the folder is one topic (ContentFile).
type SubjectMeta = {
  subject: string;
  description?: string;
  icon?: string;
  order?: number;
  semester: { name: string; year?: string };
};

// ── Tidy tree layout (horizontal, left→right) ───────────────────────────────
// Matches the node handles (target=left, source=right): root on the left,
// branches fan out to the right. Depth → x, leaf order → y.
const LEVEL_GAP = 340; // horizontal distance between depths
const SIBLING_GAP = 150; // vertical distance between adjacent leaves

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

  // BFS order so parents are inserted before children
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
  console.log("Starting seed...");

  // ── Users ──
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const studentPassword = bcrypt.hashSync("belajar123", 10);

  await prisma.user.upsert({
    where: { email: "henryaugusta8@gmail.com" },
    update: {},
    create: { name: "Henry Augusta", email: "henryaugusta8@gmail.com", role: "ADMIN", password: adminPassword },
  });
  await prisma.user.upsert({
    where: { email: "carens@studypal.app" },
    update: { tone: "SWEET" },
    create: { name: "Endah", email: "carens@studypal.app", role: "USER", password: studentPassword, tone: "SWEET" },
  });
  console.log("Upserted users.");

  // ── Load subjects (one subfolder per subject) ──
  const contentDir = join(process.cwd(), "prisma", "content");
  const subjectDirs = readdirSync(contentDir)
    .filter((f) => statSync(join(contentDir, f)).isDirectory())
    .map((dir) => {
      const meta = JSON.parse(
        readFileSync(join(contentDir, dir, "_subject.json"), "utf-8"),
      ) as SubjectMeta;
      return { dir, meta };
    })
    .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));

  console.log(`Found ${subjectDirs.length} subject(s).`);

  for (const { dir, meta } of subjectDirs) {
  // ── Semester (match by name + year) & Subject (match by name within semester) ──
  let semester = await prisma.semester.findFirst({
    where: { name: meta.semester.name, year: meta.semester.year ?? null },
  });
  semester ??= await prisma.semester.create({
    data: { name: meta.semester.name, year: meta.semester.year },
  });

  let subject = await prisma.subject.findFirst({
    where: { name: meta.subject, semesterId: semester.id },
  });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        name: meta.subject,
        description: meta.description,
        icon: meta.icon,
        semesterId: semester.id,
      },
    });
  } else {
    await prisma.subject.update({
      where: { id: subject.id },
      data: { description: meta.description ?? subject.description, icon: meta.icon ?? subject.icon },
    });
  }
  console.log(`\nSubject: ${subject.name}`);

  // ── Load this subject's topic files (every *.json except _subject.json) ──
  const files = readdirSync(join(contentDir, dir)).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_"),
  );
  const contents: ContentFile[] = files
    .map((f) => JSON.parse(readFileSync(join(contentDir, dir, f), "utf-8")) as ContentFile)
    .sort((a, b) => a.order - b.order);

  console.log(`  ${contents.length} topic file(s).`);

  for (const data of contents) {
    // Topic (match by subjectId + name)
    let topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, name: data.topic },
    });
    if (!topic) {
      topic = await prisma.topic.create({
        data: { name: data.topic, description: data.description, order: data.order, subjectId: subject.id },
      });
    } else {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { description: data.description ?? topic.description, order: data.order },
      });
    }

    // ── Questions (replace) ──
    const existingQ = await prisma.question.findMany({ where: { topicId: topic.id }, select: { id: true } });
    if (existingQ.length > 0) {
      const ids = existingQ.map((q) => q.id);
      await prisma.questionOption.deleteMany({ where: { questionId: { in: ids } } });
      await prisma.quizAnswer.deleteMany({ where: { questionId: { in: ids } } });
      await prisma.questionProgress.deleteMany({ where: { questionId: { in: ids } } });
      await prisma.questionBookmark.deleteMany({ where: { questionId: { in: ids } } });
      await prisma.question.deleteMany({ where: { topicId: topic.id } });
    }
    let qOrder = 0;
    for (const q of data.questions) {
      await prisma.question.create({
        data: {
          topicId: topic.id,
          text: q.text,
          explanation: q.explanation,
          difficulty: q.difficulty ?? "MEDIUM",
          tag: q.tag,
          order: qOrder++,
          options: { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i })) },
        },
      });
    }

    // ── Flashcards (replace) ──
    const existingFc = await prisma.flashcard.findMany({ where: { topicId: topic.id }, select: { id: true } });
    if (existingFc.length > 0) {
      await prisma.flashcardProgress.deleteMany({ where: { flashcardId: { in: existingFc.map((f) => f.id) } } });
      await prisma.flashcard.deleteMany({ where: { topicId: topic.id } });
    }
    let fcOrder = 0;
    for (const fc of data.flashcards) {
      await prisma.flashcard.create({
        data: { topicId: topic.id, front: fc.front, back: fc.back, order: fcOrder++ },
      });
    }

    // ── Mindmap (replace, with auto-layout) ──
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

    console.log(
      `  ${data.topic}: ${data.questions.length} soal, ${data.flashcards.length} flashcard, ${data.mindmap.length} node`,
    );
  }
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
