"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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

type Semester = {
  id: number;
  name: string;
  year: string | null;
};

function SemesterFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Semester | null;
  onSave: (data: { name: string; year?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [year, setYear] = useState(initial?.year ?? "");

  function handleOpen(v: boolean) {
    if (v) {
      setName(initial?.name ?? "");
      setYear(initial?.year ?? "");
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Semester" : "Tambah Semester"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Nama Semester</label>
            <Input
              className="border-input bg-accent text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Semester 1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Tahun (opsional)</label>
            <Input
              className="border-input bg-accent text-foreground"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="cth. 2024/2025"
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
            onClick={() => onSave({ name: name.trim(), year: year.trim() || undefined })}
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
          <DialogTitle>Hapus Semester</DialogTitle>
        </DialogHeader>
        <p className="text-foreground">
          Yakin ingin menghapus semester <strong>&quot;{name}&quot;</strong>? Semua mata
          pelajaran dan topik di dalamnya akan ikut terhapus.
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

export default function SemesterPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: semesters, isLoading } = api.semester.getAll.useQuery();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);

  const createMut = api.semester.create.useMutation({
    onSuccess: async () => {
      await utils.semester.getAll.invalidate();
      setAddOpen(false);
    },
  });

  const updateMut = api.semester.update.useMutation({
    onSuccess: async () => {
      await utils.semester.getAll.invalidate();
      setEditTarget(null);
    },
  });

  const deleteMut = api.semester.delete.useMutation({
    onSuccess: async () => {
      await utils.semester.getAll.invalidate();
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Semester</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar semester</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Tambah Semester
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Nama</TableHead>
              <TableHead className="text-muted-foreground">Tahun</TableHead>
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
            {!isLoading && (!semesters || semesters.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada semester.
                </TableCell>
              </TableRow>
            )}
            {semesters?.map((sem) => (
              <TableRow
                key={sem.id}
                className="cursor-pointer border-border hover:bg-accent"
                onClick={() => router.push(`/admin/subject/${sem.id}`)}
              >
                <TableCell className="text-muted-foreground">{sem.id}</TableCell>
                <TableCell className="font-medium text-foreground">{sem.name}</TableCell>
                <TableCell className="text-muted-foreground">{sem.year ?? "-"}</TableCell>
                <TableCell
                  className="space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-input bg-transparent text-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setEditTarget(sem)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(sem)}
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <SemesterFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) => createMut.mutate(data)}
        loading={createMut.isPending}
      />

      {/* Edit Dialog */}
      <SemesterFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        initial={editTarget}
        onSave={(data) => {
          if (editTarget) updateMut.mutate({ id: editTarget.id, ...data });
        }}
        loading={updateMut.isPending}
      />

      {/* Delete Dialog */}
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
