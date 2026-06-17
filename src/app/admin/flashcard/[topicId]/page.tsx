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

type Flashcard = {
  id: number;
  front: string;
  back: string;
  order: number;
  topicId: number;
};

function FlashcardFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Flashcard | null;
  onSave: (data: { front: string; back: string; order?: number }) => void;
  loading: boolean;
}) {
  const [front, setFront] = useState(initial?.front ?? "");
  const [back, setBack] = useState(initial?.back ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));

  function handleOpen(v: boolean) {
    if (v) {
      setFront(initial?.front ?? "");
      setBack(initial?.back ?? "");
      setOrder(String(initial?.order ?? 0));
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Flashcard" : "Tambah Flashcard"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Depan (Pertanyaan)</label>
            <Textarea
              className="border-border bg-accent text-foreground"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Tuliskan pertanyaan atau kata kunci..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Belakang (Jawaban)</label>
            <Textarea
              className="border-border bg-accent text-foreground"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Tuliskan jawaban atau penjelasan..."
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Urutan</label>
            <Input
              className="border-border bg-accent text-foreground"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
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
            disabled={loading || !front.trim() || !back.trim()}
            onClick={() =>
              onSave({
                front: front.trim(),
                back: back.trim(),
                order: parseInt(order, 10) || 0,
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
          <DialogTitle>Hapus Flashcard</DialogTitle>
        </DialogHeader>
        <p className="text-foreground">Yakin ingin menghapus flashcard ini?</p>
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

export default function FlashcardPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const tId = parseInt(topicId, 10);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: flashcards, isLoading } = api.flashcard.getByTopic.useQuery({
    topicId: tId,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Flashcard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);

  const createMut = api.flashcard.create.useMutation({
    onSuccess: async () => {
      await utils.flashcard.getByTopic.invalidate({ topicId: tId });
      setAddOpen(false);
    },
  });

  const updateMut = api.flashcard.update.useMutation({
    onSuccess: async () => {
      await utils.flashcard.getByTopic.invalidate({ topicId: tId });
      setEditTarget(null);
    },
  });

  const deleteMut = api.flashcard.delete.useMutation({
    onSuccess: async () => {
      await utils.flashcard.getByTopic.invalidate({ topicId: tId });
      setDeleteTarget(null);
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
          <h1 className="text-2xl font-bold text-foreground">Flashcard</h1>
          <p className="text-sm text-muted-foreground">Topic ID: {tId}</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Tambah Flashcard
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Depan</TableHead>
              <TableHead className="text-muted-foreground">Belakang</TableHead>
              <TableHead className="w-32 text-muted-foreground">Aksi</TableHead>
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
            {!isLoading && (!flashcards || flashcards.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada flashcard.
                </TableCell>
              </TableRow>
            )}
            {flashcards?.map((fc, idx) => (
              <TableRow key={fc.id} className="border-border hover:bg-accent">
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="line-clamp-2 text-sm text-foreground">{fc.front}</p>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{fc.back}</p>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border bg-transparent text-foreground hover:bg-accent hover:text-foreground"
                    onClick={() =>
                      setEditTarget({
                        id: fc.id,
                        front: fc.front,
                        back: fc.back,
                        order: fc.order,
                        topicId: fc.topicId,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({
                        id: fc.id,
                        front: fc.front,
                        back: fc.back,
                        order: fc.order,
                        topicId: fc.topicId,
                      })
                    }
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FlashcardFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => createMut.mutate({ topicId: tId, ...data })}
        loading={createMut.isPending}
      />

      <FlashcardFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        initial={editTarget}
        onSave={(data) => {
          if (editTarget) updateMut.mutate({ id: editTarget.id, ...data });
        }}
        loading={updateMut.isPending}
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
