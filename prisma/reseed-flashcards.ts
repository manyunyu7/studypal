import { PrismaClient } from "../generated/prisma";
import { readFileSync } from "fs";
import { join } from "path";

// Reseed ONLY the flashcards for one topic from its content JSON.
// Does NOT touch questions or mindmap. (Flashcard progress for the topic is reset.)
// Usage: tsx prisma/reseed-flashcards.ts <content-file.json>

const prisma = new PrismaClient();

type ContentFlashcard = { front: string; back: string; tag?: string };

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx prisma/reseed-flashcards.ts <content-file.json>");
  const data = JSON.parse(readFileSync(join("prisma/content", file), "utf-8")) as {
    topic: string;
    flashcards: ContentFlashcard[];
  };

  const topic = await prisma.topic.findFirst({ where: { name: data.topic } });
  if (!topic) throw new Error(`Topic "${data.topic}" not found in DB`);

  const existing = await prisma.flashcard.findMany({ where: { topicId: topic.id }, select: { id: true } });
  if (existing.length > 0) {
    await prisma.flashcardProgress.deleteMany({ where: { flashcardId: { in: existing.map((f) => f.id) } } });
    await prisma.flashcard.deleteMany({ where: { topicId: topic.id } });
  }

  let order = 0;
  for (const fc of data.flashcards) {
    await prisma.flashcard.create({
      data: { topicId: topic.id, front: fc.front, back: fc.back, order: order++ },
    });
  }

  console.log(`${data.topic}: ${data.flashcards.length} flashcard di-reseed (topicId ${topic.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
