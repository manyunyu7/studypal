"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const { data, isLoading, error } = api.user.getDetail.useQuery(
    { userId: params.userId },
    { retry: false },
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
        ← Kembali ke daftar user
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {error.message}
        </div>
      )}

      {data && (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <Avatar className="h-14 w-14">
              <AvatarImage src={data.user.image ?? undefined} alt={data.user.name ?? ""} />
              <AvatarFallback className="bg-primary/15 text-lg text-primary">
                {(data.user.name ?? data.user.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-foreground">
                  {data.user.name ?? "-"}
                </h1>
                {data.user.role === "ADMIN" && (
                  <Badge className="bg-primary/15 text-primary">Admin</Badge>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{data.user.email}</p>
              <p className="text-xs text-muted-foreground">
                Bergabung {formatDateTime(data.user.createdAt)}
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Total Quiz" value={data.stats.totalAttempts} />
            <StatCard label="Rata-rata" value={`${data.stats.avgScore}%`} />
            <StatCard label="Nilai Terbaik" value={`${data.stats.bestScore}%`} />
            <StatCard label="Flashcard Dikuasai" value={data.stats.masteredFlashcards} />
            <StatCard label="Total Aktivitas" value={data.stats.activityCount} />
          </div>

          {data.stats.lastActivity && (
            <p className="text-sm text-muted-foreground">
              Aktivitas terakhir: {data.stats.lastActivity.label ?? data.stats.lastActivity.type}{" "}
              · {formatDateTime(data.stats.lastActivity.createdAt)}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Per-subject */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Performa per Mata Kuliah
              </p>
              <div className="space-y-3">
                {data.perSubject.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada quiz.</p>
                )}
                {data.perSubject.map((s) => (
                  <div key={s.subjectId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="min-w-0 flex-1 truncate text-foreground">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.attempts}×</span>
                      <span className="ml-3 w-10 text-right font-semibold tabular-nums text-foreground">
                        {s.avgPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          s.avgPct >= 70 ? "bg-emerald-500" : s.avgPct >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${s.avgPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent attempts */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quiz Terakhir
              </p>
              <div className="space-y-2">
                {data.recentAttempts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada quiz.</p>
                )}
                {data.recentAttempts.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span
                      className={`w-11 flex-shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${
                        a.percentage >= 70
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : a.percentage >= 50
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {a.percentage}%
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{a.label}</span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {a.score}/{a.total}
                    </span>
                    <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personalisasi */}
          <PersonalizationEditor userId={data.user.id} />
        </>
      )}
    </div>
  );
}

function PersonalizationEditor({ userId }: { userId: string }) {
  const utils = api.useUtils();
  const { data, isLoading } = api.personalization.getForUser.useQuery(
    { userId },
    { retry: false },
  );

  const [tone, setTone] = useState<"SWEET" | "NEUTRAL">("NEUTRAL");
  const [authorName, setAuthorName] = useState("");
  const [letterTitle, setLetterTitle] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [greeting, setGreeting] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTone(data.tone);
    setAuthorName(data.authorName);
    setLetterTitle(data.letterTitle);
    setLetterBody(data.letterBody);
    setGreeting(data.greeting);
  }, [data]);

  const save = api.personalization.update.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await Promise.all([
        utils.personalization.getForUser.invalidate({ userId }),
        utils.personalization.getMine.invalidate(),
      ]);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Personalisasi
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Atur nada sapaan & pesan personal untuk user ini. Kosongkan kolom teks
          untuk memakai template bawaan sesuai nada.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-accent" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nada (tone)</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as "SWEET" | "NEUTRAL")}>
                <SelectTrigger className="border-border bg-accent text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  <SelectItem value="NEUTRAL">Netral (umum)</SelectItem>
                  <SelectItem value="SWEET">Sweet (mesra) 💕</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanda tangan / nama pengirim</Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Henry"
                className="border-border bg-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Judul surat (/untukmu)</Label>
            <Input
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
              placeholder="Untukmu, {name} 💕  — kosong = template"
              className="border-border bg-accent"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Isi surat (/untukmu)</Label>
            <Textarea
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              rows={8}
              placeholder="Pisahkan paragraf dengan baris kosong. Pakai {name} untuk nama user. Kosong = tidak ada surat (menu Untukmu disembunyikan, kecuali nada Sweet pakai template bawaan)."
              className="border-border bg-accent"
            />
            <p className="text-[11px] text-muted-foreground">
              Placeholder: <code>{"{name}"}</code> = nama user,{" "}
              <code>{"{author}"}</code> = tanda tangan.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Sub-greeting dashboard (opsional)</Label>
            <Input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Kosong = template"
              className="border-border bg-accent"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() =>
                save.mutate({ userId, tone, authorName, letterTitle, letterBody, greeting })
              }
              disabled={save.isPending}
            >
              {save.isPending ? "Menyimpan…" : "Simpan personalisasi"}
            </Button>
            {saved && <span className="text-sm text-emerald-500">Tersimpan ✓</span>}
            {save.isError && (
              <span className="text-sm text-destructive">Gagal menyimpan.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
