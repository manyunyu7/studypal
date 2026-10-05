/**
 * Targeted seed — hanya memproses topik tertentu, AMAN untuk production.
 *
 * Bedanya dengan seed.ts (full): script ini TIDAK loop semua folder/topik.
 * Ia hanya memproses file topik yang kamu sebut di argumen, jadi tidak akan
 * menyentuh (apalagi menghapus) soal/flashcard/mindmap + progress user pada
 * topik lain.
 *
 * GUARD KEAMANAN: secara default script MENOLAK kalau topik sudah ada & sudah
 * punya soal (karena ini ditujukan untuk topik BARU). Menimpa topik lama akan
 * menghapus QuizAnswer/QuestionProgress/QuestionBookmark/FlashcardProgress user.
 * Gunakan --force HANYA kalau kamu memang sengaja mau replace (data user hilang).
 *
 * Pemakaian:
 *   npx tsx prisma/seed-topics.ts <folder>/<file>.json [<folder>/<file>.json ...]
 *   npx tsx prisma/seed-topics.ts --force <folder>/<file>.json   # timpa (BERBAHAYA)
 *
 * Contoh:
 *   npx tsx prisma/seed-topics.ts fisiologi-kerja/beban-kerja-fisik.json \
 *                                 kesehatan-kerja/penyelenggaraan-makanan.json
 */
import { PrismaClient, type Difficulty } from "../generated/prisma";
import { readFileSync } from "fs";
import { join, dirname, basename } from "path";

const prisma = new PrismaClient();

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
type SubjectMeta = {
  subject: string;
  description?: string;
  icon?: string;
  order?: number;
  semester: { name: string; year?: string };
};

// ── Layout mindmap (copy dari seed.ts) ──
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
  const rawArgs = process.argv.slice(2);
  const force = rawArgs.includes("--force");
  const dryRun = rawArgs.includes("--dry-run");
  const targets = rawArgs.filter((a) => !a.startsWith("--"));

  if (targets.length === 0) {
    console.error("Usage: tsx prisma/seed-topics.ts [--force] [--dry-run] <folder>/<file>.json ...");
    process.exit(1);
  }

  const contentDir = join(process.cwd(), "prisma", "content");
  console.log(`Targeted seed — ${targets.length} topik${force ? " (FORCE)" : ""}${dryRun ? " (DRY-RUN)" : ""}`);
  console.log(`DB: ${process.env.DATABASE_URL?.replace(/:\/\/[^@]*@/, "://***@")}`);

  for (const rel of targets) {
    const fullPath = join(contentDir, rel);
    const subjectDir = dirname(rel);
    const meta = JSON.parse(
      readFileSync(join(contentDir, subjectDir, "_subject.json"), "utf-8"),
    ) as SubjectMeta;
    const data = JSON.parse(readFileSync(fullPath, "utf-8")) as ContentFile;

    console.log(`\n── ${meta.subject} › ${data.topic}  (${basename(rel)})`);

    // ── Semester (find-or-create) ──
    let semester = await prisma.semester.findFirst({
      where: { name: meta.semester.name, year: meta.semester.year ?? null },
    });
    semester ??= dryRun
      ? null
      : await prisma.semester.create({
          data: { name: meta.semester.name, year: meta.semester.year },
        });
    console.log(`   semester: ${meta.semester.name} ${meta.semester.year ?? ""} ${semester ? "(ada)" : "(BARU)"}`);

    // ── Subject (find-or-create) ──
    let subject = semester
      ? await prisma.subject.findFirst({
          where: { name: meta.subject, semesterId: semester.id },
        })
      : null;
    console.log(`   subject: ${meta.subject} ${subject ? "(ada)" : "(BARU)"}`);

    // ── Topic: GUARD ──
    const existingTopic = subject
      ? await prisma.topic.findFirst({ where: { subjectId: subject.id, name: data.topic } })
      : null;
    if (existingTopic) {
      const qCount = await prisma.question.count({ where: { topicId: existingTopic.id } });
      if (qCount > 0 && !force) {
        console.error(
          `   ✋ ABORT: topik "${data.topic}" SUDAH ADA dengan ${qCount} soal. ` +
            `Menimpa akan menghapus progress user. Pakai --force kalau memang sengaja.`,
        );
        process.exit(2);
      }
      console.log(`   ⚠️  topik sudah ada (${qCount} soal)${force ? " — akan DITIMPA (--force)" : ""}`);
    } else {
      console.log(`   topik: BARU (aman, hanya create)`);
    }

    console.log(`   konten: ${data.questions.length} soal, ${data.flashcards.length} flashcard, ${data.mindmap.length} node`);

    if (dryRun) {
      console.log("   (dry-run: tidak menulis ke DB)");
      continue;
    }

    // ── Create/update subject (sekarang pasti tidak dry-run) ──
    if (!subject) {
      subject = await prisma.subject.create({
        data: { name: meta.subject, description: meta.description, icon: meta.icon, semesterId: semester!.id },
      });
    }

    // ── Topic (find-or-create) ──
    let topic = existingTopic;
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

    // ── Mindmap (replace) ──
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

    console.log(`   ✅ selesai: ${data.questions.length} soal, ${data.flashcards.length} flashcard, ${data.mindmap.length} node`);
  }

  console.log("\nTargeted seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
