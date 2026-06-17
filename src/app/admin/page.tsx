import Link from "next/link";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

async function getStats() {
  const [users, semesters, subjects, topics, questions, flashcards] =
    await Promise.all([
      db.user.count(),
      db.semester.count(),
      db.subject.count(),
      db.topic.count(),
      db.question.count(),
      db.flashcard.count(),
    ]);
  return { users, semesters, subjects, topics, questions, flashcards };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Users", value: stats.users },
    { label: "Total Semesters", value: stats.semesters },
    { label: "Total Subjects", value: stats.subjects },
    { label: "Total Topics", value: stats.topics },
    { label: "Total Questions", value: stats.questions },
    { label: "Total Flashcards", value: stats.flashcards },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of all StudyPal content
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-foreground">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/admin/semester">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:border-border hover:bg-accent">
              <CardContent className="flex flex-col gap-2 pt-6">
                <span className="text-2xl">🗓</span>
                <span className="font-semibold text-foreground">Tambah Semester</span>
                <span className="text-sm text-muted-foreground">
                  Kelola semester dan mata pelajaran
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/semester">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:border-border hover:bg-accent">
              <CardContent className="flex flex-col gap-2 pt-6">
                <span className="text-2xl">❓</span>
                <span className="font-semibold text-foreground">Kelola Soal</span>
                <span className="text-sm text-muted-foreground">
                  Tambah, edit, dan import soal latihan
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/semester">
            <Card className="cursor-pointer border-border bg-card transition-colors hover:border-border hover:bg-accent">
              <CardContent className="flex flex-col gap-2 pt-6">
                <span className="text-2xl">🃏</span>
                <span className="font-semibold text-foreground">Kelola Flashcard</span>
                <span className="text-sm text-muted-foreground">
                  Buat dan kelola flashcard pembelajaran
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
