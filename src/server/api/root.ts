import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { semesterRouter } from "~/server/api/routers/semester";
import { subjectRouter } from "~/server/api/routers/subject";
import { topicRouter } from "~/server/api/routers/topic";
import { questionRouter } from "~/server/api/routers/question";
import { flashcardRouter } from "~/server/api/routers/flashcard";
import { mindmapRouter } from "~/server/api/routers/mindmap";
import { quizRouter } from "~/server/api/routers/quiz";
import { userRouter } from "~/server/api/routers/user";
import { activityRouter } from "~/server/api/routers/activity";

export const appRouter = createTRPCRouter({
  semester: semesterRouter,
  subject: subjectRouter,
  topic: topicRouter,
  question: questionRouter,
  flashcard: flashcardRouter,
  mindmap: mindmapRouter,
  quiz: quizRouter,
  user: userRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
