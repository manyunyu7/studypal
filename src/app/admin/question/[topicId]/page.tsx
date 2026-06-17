"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";

type QuestionOption = {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
};

type Question = {
  id: number;
  text: string;
  explanation: string | null;
  options: QuestionOption[];
};

type OptionInput = {
  text: string;
  isCorrect: boolean;
};

const emptyOptions: OptionInput[] = [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

function QuestionFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Question | null;
  onSave: (data: {
    text: string;
    explanation?: string;
    options: OptionInput[];
  }) => void;
  loading: boolean;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [options, setOptions] = useState<OptionInput[]>(
    initial?.options?.length
      ? initial.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : emptyOptions,
  );

  function handleOpen(v: boolean) {
    if (v) {
      setText(initial?.text ?? "");
      setExplanation(initial?.explanation ?? "");
      setOptions(
        initial?.options?.length
          ? initial.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
          : [...emptyOptions.map((o) => ({ ...o }))],
      );
    }
    onOpenChange(v);
  }

  function setOptionText(idx: number, val: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text: val } : o)));
  }

  function setOptionCorrect(idx: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }

  const hasCorrect = options.some((o) => o.isCorrect);
  const allFilled = options.every((o) => o.text.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Teks Soal</label>
            <Textarea
              className="border-border bg-accent text-foreground"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Masukkan pertanyaan..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Penjelasan (opsional)</label>
            <Textarea
              className="border-border bg-accent text-foreground"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Penjelasan mengapa jawaban ini benar..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Pilihan Jawaban{" "}
              <span className="text-xs text-muted-foreground">(klik radio untuk tandai benar)</span>
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  checked={opt.isCorrect}
                  onChange={() => setOptionCorrect(idx)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="w-6 text-sm text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                <Input
                  className="flex-1 border-border bg-accent text-foreground"
                  value={opt.text}
                  onChange={(e) => setOptionText(idx, e.target.value)}
                  placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                />
                {opt.isCorrect && (
                  <Badge className="bg-green-900 text-green-300">Benar</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            disabled={loading || !text.trim() || !allFilled || !hasCorrect}
            onClick={() =>
              onSave({
                text: text.trim(),
                explanation: explanation.trim() || undefined,
                options: options.map((o) => ({ ...o, text: o.text.trim() })),
              })
            }
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (questions: { text: string; explanation?: string; options: OptionInput[] }[]) => void;
  loading: boolean;
}) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");

  function handleOpen(v: boolean) {
    if (v) {
      setJsonText("");
      setError("");
    }
    onOpenChange(v);
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(parsed)) throw new Error("JSON harus berupa array");
      onImport(parsed as { text: string; explanation?: string; options: OptionInput[] }[]);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON tidak valid");
    }
  }

  const exampleJson = `[
  {
    "text": "Apa ibu kota Indonesia?",
    "explanation": "Jakarta adalah ibu kota Indonesia.",
    "options": [
      { "text": "Bandung", "isCorrect": false },
      { "text": "Jakarta", "isCorrect": true },
      { "text": "Surabaya", "isCorrect": false },
      { "text": "Medan", "isCorrect": false }
    ]
  }
]`;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Soal dari JSON</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border border-border bg-accent p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Format JSON:</p>
            <pre className="overflow-x-auto text-xs text-foreground">{exampleJson}</pre>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Paste JSON Array Soal</label>
            <Textarea
              className="border-border bg-accent font-mono text-sm text-foreground"
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError("");
              }}
              placeholder='[{"text": "...", "options": [...]}]'
              rows={10}
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            disabled={loading || !jsonText.trim()}
            onClick={handleImport}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Mengimport..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Hapus Soal</DialogTitle>
        </DialogHeader>
        <p className="text-foreground">Yakin ingin menghapus soal ini?</p>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function QuestionPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const tId = parseInt(topicId, 10);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: questions, isLoading } = api.question.getByTopic.useQuery({
    topicId: tId,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const createMut = api.question.create.useMutation({
    onSuccess: async () => {
      await utils.question.getByTopic.invalidate({ topicId: tId });
      setAddOpen(false);
    },
  });

  const updateMut = api.question.update.useMutation({
    onSuccess: async () => {
      await utils.question.getByTopic.invalidate({ topicId: tId });
      setEditTarget(null);
    },
  });

  const deleteMut = api.question.delete.useMutation({
    onSuccess: async () => {
      await utils.question.getByTopic.invalidate({ topicId: tId });
      setDeleteTarget(null);
    },
  });

  const bulkImportMut = api.question.bulkImport.useMutation({
    onSuccess: async () => {
      await utils.question.getByTopic.invalidate({ topicId: tId });
      setImportOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Soal</h1>
          <p className="text-sm text-muted-foreground">Topic ID: {tId}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
          >
            Import JSON
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Tambah Soal
          </Button>
        </div>
      </div>

      {bulkImportMut.isSuccess && (
        <div className="rounded-md bg-green-950 px-4 py-2 text-sm text-green-400">
          Import berhasil: {bulkImportMut.data?.count} soal ditambahkan.
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-8 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Soal</TableHead>
              <TableHead className="text-muted-foreground">Pilihan</TableHead>
              <TableHead className="text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Memuat...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!questions || questions.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada soal.
                </TableCell>
              </TableRow>
            )}
            {questions?.map((q, idx) => (
              <TableRow key={q.id} className="border-border hover:bg-accent">
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="line-clamp-2 text-sm text-foreground">{q.text}</p>
                  {q.explanation && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      Penjelasan: {q.explanation}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-1">
                        {opt.isCorrect ? (
                          <span className="text-xs text-green-400">✓</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">·</span>
                        )}
                        <span
                          className={`text-xs ${opt.isCorrect ? "text-green-300" : "text-muted-foreground"}`}
                        >
                          {opt.text.length > 40 ? opt.text.slice(0, 40) + "..." : opt.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setEditTarget(q)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(q)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuestionFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => createMut.mutate({ topicId: tId, ...data })}
        loading={createMut.isPending}
      />

      <QuestionFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        initial={editTarget}
        onSave={(data) => {
          if (editTarget) updateMut.mutate({ id: editTarget.id, ...data });
        }}
        loading={updateMut.isPending}
      />

      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(questions) => bulkImportMut.mutate({ topicId: tId, questions })}
        loading={bulkImportMut.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id });
        }}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
