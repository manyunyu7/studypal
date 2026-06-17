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

type Subject = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  semesterId: number;
  _count: { topics: number };
};

function SubjectFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Subject | null;
  onSave: (data: { name: string; description?: string; icon?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");

  function handleOpen(v: boolean) {
    if (v) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setIcon(initial?.icon ?? "");
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Nama</label>
            <Input
              className="border-input bg-accent text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Matematika"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Deskripsi (opsional)</label>
            <Textarea
              className="border-input bg-accent text-foreground"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat..."
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Icon / Emoji (opsional)</label>
            <Input
              className="border-input bg-accent text-foreground"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="cth. 📐"
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
                icon: icon.trim() || undefined,
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
          <DialogTitle>Hapus Mata Pelajaran</DialogTitle>
        </DialogHeader>
        <p className="text-foreground">
          Yakin ingin menghapus <strong>&quot;{name}&quot;</strong>? Semua topik di dalamnya
          akan ikut terhapus.
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

export default function SubjectPage({
  params,
}: {
  params: Promise<{ semesterId: string }>;
}) {
  const { semesterId } = use(params);
  const semId = parseInt(semesterId, 10);
  const router = useRouter();
  const utils = api.useUtils();

  const { data: subjects, isLoading } = api.subject.getBySemester.useQuery({
    semesterId: semId,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const createMut = api.subject.create.useMutation({
    onSuccess: async () => {
      await utils.subject.getBySemester.invalidate({ semesterId: semId });
      setAddOpen(false);
    },
  });

  const updateMut = api.subject.update.useMutation({
    onSuccess: async () => {
      await utils.subject.getBySemester.invalidate({ semesterId: semId });
      setEditTarget(null);
    },
  });

  const deleteMut = api.subject.delete.useMutation({
    onSuccess: async () => {
      await utils.subject.getBySemester.invalidate({ semesterId: semId });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/semester")}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Mata Pelajaran</h1>
          <p className="text-sm text-muted-foreground">Semester ID: {semId}</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Tambah Mata Pelajaran
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Icon</TableHead>
              <TableHead className="text-muted-foreground">Nama</TableHead>
              <TableHead className="text-muted-foreground">Deskripsi</TableHead>
              <TableHead className="text-muted-foreground">Topik</TableHead>
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
            {!isLoading && (!subjects || subjects.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada mata pelajaran.
                </TableCell>
              </TableRow>
            )}
            {subjects?.map((sub) => (
              <TableRow
                key={sub.id}
                className="cursor-pointer border-border hover:bg-accent"
                onClick={() => router.push(`/admin/topic/${sub.id}`)}
              >
                <TableCell className="text-xl">{sub.icon ?? "📚"}</TableCell>
                <TableCell className="font-medium text-foreground">{sub.name}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {sub.description ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">{sub._count.topics}</TableCell>
                <TableCell
                  className="space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-input bg-transparent text-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setEditTarget(sub)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(sub)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SubjectFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => createMut.mutate({ ...data, semesterId: semId })}
        loading={createMut.isPending}
      />

      <SubjectFormDialog
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
