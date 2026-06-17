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

type Topic = {
  id: number;
  name: string;
  description: string | null;
  order: number;
  subjectId: number;
};

function TopicFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Topic | null;
  onSave: (data: { name: string; description?: string; order?: number }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));

  function handleOpen(v: boolean) {
    if (v) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setOrder(String(initial?.order ?? 0));
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Topik" : "Tambah Topik"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Nama Topik</label>
            <Input
              className="border-input bg-accent text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Persamaan Linear"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Deskripsi (opsional)</label>
            <Textarea
              className="border-input bg-accent text-foreground"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat topik..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Urutan</label>
            <Input
              className="border-input bg-accent text-foreground"
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
            disabled={loading || !name.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: description.trim() || undefined,
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
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  name: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Hapus Topik</DialogTitle>
        </DialogHeader>
        <p className="text-foreground">
          Yakin ingin menghapus topik <strong>&quot;{name}&quot;</strong>? Semua soal,
          flashcard, dan mindmap di dalamnya akan ikut terhapus.
        </p>
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
            className="bg-destructive text-primary-foreground hover:bg-destructive/90"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TopicPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = use(params);
  const subId = parseInt(subjectId, 10);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: topics, isLoading } = api.topic.getBySubject.useQuery({
    subjectId: subId,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Topic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  const createMut = api.topic.create.useMutation({
    onSuccess: async () => {
      await utils.topic.getBySubject.invalidate({ subjectId: subId });
      setAddOpen(false);
    },
  });

  const updateMut = api.topic.update.useMutation({
    onSuccess: async () => {
      await utils.topic.getBySubject.invalidate({ subjectId: subId });
      setEditTarget(null);
    },
  });

  const deleteMut = api.topic.delete.useMutation({
    onSuccess: async () => {
      await utils.topic.getBySubject.invalidate({ subjectId: subId });
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
          <h1 className="text-2xl font-bold text-foreground">Topik</h1>
          <p className="text-sm text-muted-foreground">Subject ID: {subId}</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Tambah Topik
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Urutan</TableHead>
              <TableHead className="text-muted-foreground">Nama</TableHead>
              <TableHead className="text-muted-foreground">Deskripsi</TableHead>
              <TableHead className="text-muted-foreground">Konten</TableHead>
              <TableHead className="text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Memuat...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (!topics || topics.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada topik.
                </TableCell>
              </TableRow>
            )}
            {topics?.map((topic) => (
              <TableRow key={topic.id} className="border-border hover:bg-accent">
                <TableCell className="text-muted-foreground">{topic.order}</TableCell>
                <TableCell className="font-medium text-foreground">{topic.name}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {topic.description ?? "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className="cursor-pointer bg-blue-900 text-blue-300 hover:bg-blue-800"
                      onClick={() => router.push(`/admin/question/${topic.id}`)}
                    >
                      Soal
                    </Badge>
                    <Badge
                      className="cursor-pointer bg-green-900 text-green-300 hover:bg-green-800"
                      onClick={() => router.push(`/admin/flashcard/${topic.id}`)}
                    >
                      Flashcard
                    </Badge>
                    <Badge
                      className="cursor-pointer bg-purple-900 text-purple-300 hover:bg-purple-800"
                      onClick={() => router.push(`/admin/mindmap/${topic.id}`)}
                    >
                      Mindmap
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-input bg-transparent text-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setEditTarget(topic)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(topic)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TopicFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => createMut.mutate({ ...data, subjectId: subId })}
        loading={createMut.isPending}
      />

      <TopicFormDialog
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
        name={deleteTarget?.name ?? ""}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id });
        }}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
