# StudyPal

Platform belajar interaktif multi-user untuk mahasiswa. Dibuat untuk Endah, reusable untuk banyak user dan antar semester.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: MySQL + Prisma ORM (client di `generated/prisma/`)
- **Auth**: NextAuth.js v5 beta — credentials (email+password), JWT strategy
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **API**: tRPC v11
- **Mindmap**: React Flow

## Struktur Folder

```
src/
├── app/
│   ├── (auth)/              # login, register — public routes
│   ├── (student)/           # dashboard, quiz, flashcard, mindmap — protected
│   ├── admin/               # admin panel — ADMIN role only
│   └── api/
│       ├── auth/            # NextAuth + register endpoint
│       └── trpc/            # tRPC handler
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── quiz/                # QuizOption.tsx
│   ├── flashcard/           # FlashCard.tsx, FlashcardProgress.tsx
│   ├── mindmap/             # MindmapView.tsx, MindmapNode.tsx
│   └── student/             # SignOutButton.tsx
├── server/
│   ├── api/routers/         # tRPC routers: semester, subject, topic,
│   │                        #   question, flashcard, mindmap, quiz, user
│   ├── api/root.ts          # appRouter — import semua router di sini
│   ├── api/trpc.ts          # publicProcedure, protectedProcedure, adminProcedure
│   └── auth/config.ts       # NextAuth config (credentials provider)
├── middleware.ts             # proteksi route, cek role ADMIN
└── lib/utils.ts             # cn() helper
prisma/
├── schema.prisma            # MySQL schema
├── seed.ts                  # loader: baca prisma/content/, upsert ke DB
└── content/<matkul-slug>/   # sumber konten — 1 subfolder per matkul
    ├── _subject.json        #   meta matkul: subject, icon, order, semester
    └── <topik>.json         #   1 file per topik (questions/flashcards/mindmap)
generated/prisma/            # Prisma client (auto-generated, jangan edit)
```

## Database Schema Ringkas

```
Semester → Subject → Topic
                       ├── Question + QuestionOption
                       ├── Flashcard
                       └── MindmapNode (tree via parentId)

User → QuizAttempt → QuizAnswer
     → FlashcardProgress
```

## Role & Akses

- `USER` — dashboard, quiz, flashcard, mindmap, lihat progress sendiri
- `ADMIN` — semua akses USER + CRUD semua konten + lihat semua user

## tRPC Routers

| Router | Procedures |
|--------|-----------|
| semester | getAll, create, update, delete |
| subject | getBySemester, create, update, delete |
| topic | getBySubject, getById, create, update, delete |
| question | getByTopic, create, update, delete, bulkImport |
| flashcard | getByTopic, setProgress, create, update, delete |
| mindmap | getByTopic, saveNodes |
| quiz | submitAttempt, getMyAttempts, getLeaderboard |
| user | getMyStats, getAll, updateRole |

## Import Patterns

```typescript
import { db } from "~/server/db"                    // Prisma client
import { api } from "~/trpc/server"                 // tRPC server component
import { api } from "~/trpc/react"                  // tRPC client component
import { auth } from "~/server/auth"                // session (server)
import { useSession } from "next-auth/react"        // session (client)
import { Button } from "~/components/ui/button"     // shadcn components
// Prisma types: import { Role } from "../../generated/prisma"
```

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run typecheck    # TypeScript check
npm run db:push      # sync schema ke DB (dev)
npm run db:generate  # generate migration file
npm run db:seed      # seed data awal
npx prisma studio    # GUI database browser
npm run build        # production build
```

## Menjalankan di PC Henry (macOS — local saja)

> Khusus mesin Henry. `setsid` tidak ada di macOS, jadi pakai `nohup` agar
> dev server tetap hidup di background (tidak ikut mati saat task selesai).

```bash
# start detached di port 3456, log ke /tmp/studypal-dev.log
nohup npm run dev -- --port 3456 > /tmp/studypal-dev.log 2>&1 < /dev/null &
disown

# cek status / log
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3456/   # 307 = OK (redirect ke /login)
cat /tmp/studypal-dev.log

# stop
lsof -ti:3456 | xargs kill
```

Syarat: MySQL `studypal` aktif di `localhost:3306` (lihat DATABASE_URL) supaya login/data jalan.

## Environment Variables (.env)

```env
DATABASE_URL="mysql://root:@localhost:3306/studypal"
AUTH_SECRET="..."        # auto-generated
AUTH_DISCORD_ID=""       # opsional
AUTH_DISCORD_SECRET=""   # opsional
```

## Akun Default (dari seed)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | henryaugusta8@gmail.com | admin123 |
| USER | carens@studypal.app | belajar123 |

## Cara Tambah Konten Baru

**Cara utama (file → seed):**
1. Buat folder `prisma/content/<matkul-slug>/` + `_subject.json` (subject, description, icon, order, semester{name,year}).
2. Tambah 1 file `<topik>.json` per topik (fields: topic, order, description, subtopics, questions, flashcards, mindmap). File diawali `_` di-skip seed.
3. `npm run db:seed` — idempotent (upsert): Semester match by name+year, Subject by name+semester, Topic by name+subject; soal/flashcard/mindmap di-replace.

**Alternatif (admin UI):** login admin → `/admin` → Semester → Subject → Topic → tambah/import soal manual.

## Lokasi Materi PDF

Semua materi ada di `~/Downloads/PART 2/` dengan struktur:

```
~/Downloads/PART 2/
├── HIGIENE FAKTOR FISIKA/
│   ├── 12 13  GETARAN.pptx
│   ├── 13 IKLIM KERJA PANAS _SUM.pptx
│   ├── 3  HI KEBISINGAN.pdf
│   ├── 4 HI FISIKA NOISE.pdf
│   ├── 5. PENCAHAYAAN REV  Mar  2025.pptx
│   ├── 6 7 RADIASI_ Rev Maret 2025.pptx
│   └── 9. IKLIM KERJA DINGIN.pptx
├── FISIOLOGI KERJA/
├── HIGIENE SANITASI/
├── KESEHATAN KERJA/
├── KESELAMATAN KERJA/
├── KOMUNIKASI/
├── METODE PENILAIAN RISIKO/
├── PEMERIKSAAN KESEHATAN/
├── PENDIDIKAN KEWARGANEGARAAN/
└── BAHASA INGGRIS VOKASI/
```

Baca PDF pakai pdftotext (poppler via brew):
```bash
/opt/homebrew/bin/pdftotext -layout "~/Downloads/PART 2/HIGIENE FAKTOR FISIKA/3  HI KEBISINGAN.pdf" -
```

## Generate Soal dari Materi (via Claude Code session)

1. Ekstrak materi: PDF via `/opt/homebrew/bin/pdftotext -layout "file.pdf" -`; PPTX via `unzip` lalu strip XML tag dari `ppt/slides/slideN.xml`.
2. Generate JSON rich per topik (target ~100 soal/topik, di-tag per subtopik + difficulty). Pola cepat terbukti: subagent paralel, **1 agent per topik**, output langsung ke `prisma/content/<matkul>/<topik>.json`. Validasi tiap file (4 opsi/1 benar, mindmap 1 root, tag ∈ subtopics).
3. `npm run db:seed`.

Format topik JSON: `{ topic, order, description, subtopics[], questions[{text,explanation,difficulty,tag,options[{text,isCorrect}]}], flashcards[{front,back,tag}], mindmap[{id,label,content,parent,color}] }`.

## Konten yang Sudah Ada

**Semester 2 (2025/2026)** — 10 matkul, 51 topik, ~5.835 soal (seeded):
Higiene Faktor Fisika (6), Higiene Sanitasi (6), Kesehatan Kerja (2), Keselamatan Kerja (8), Fisiologi Kerja (6), Metode Penilaian Risiko (6), Pemeriksaan Kesehatan (4), Komunikasi (7), Pendidikan Kewarganegaraan (4), Bahasa Inggris Vokasi (2). Tiap topik ~100+ soal + ~20 flashcard + mindmap.

Belum ada: **Pengukuran Faktor Fisika** (folder materi `~/Downloads/PART 2/` masih kosong).

## Deployment

- Frontend + API: Vercel
- Database: Railway / PlanetScale (MySQL)
- Set `DATABASE_URL` dan `AUTH_SECRET` di environment variables Vercel
