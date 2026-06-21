"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date | string;
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const utils = api.useUtils();
  const { data: users, isLoading } = api.user.getAll.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const updateRoleMut = api.user.updateRole.useMutation({
    onSuccess: async () => {
      await utils.user.getAll.invalidate();
      toast.success("Role diperbarui");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna, role, dan password
            {users ? ` · ${users.length} user` : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Tambah User</Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Bergabung</TableHead>
              <TableHead className="w-12 text-right text-muted-foreground"></TableHead>
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
            {!isLoading && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada pengguna.
                </TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-accent">
                <TableCell>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">
                        {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{user.name ?? "-"}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        updateRoleMut.mutate({
                          userId: user.id,
                          role: role as "USER" | "ADMIN",
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 border-border bg-accent text-xs text-foreground focus:ring-ring">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover">
                        <SelectItem value="USER" className="text-foreground focus:bg-accent focus:text-foreground">
                          USER
                        </SelectItem>
                        <SelectItem value="ADMIN" className="text-foreground focus:bg-accent focus:text-foreground">
                          ADMIN
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {user.role === "ADMIN" && (
                      <Badge className="bg-primary/15 text-primary">Admin</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt ? formatDate(user.createdAt) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" />
                      }
                    >
                      <span className="text-lg leading-none">⋯</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-border bg-popover">
                      <DropdownMenuItem render={<Link href={`/admin/users/${user.id}`} />}>
                        Lihat detail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetTarget(user)}>
                        Reset password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(user)}>
                        Hapus user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog target={resetTarget} onClose={() => setResetTarget(null)} />
      <DeleteUserDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

/* ──────────────────────── dialogs ──────────────────────── */

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const createMut = api.user.create.useMutation({
    onSuccess: async () => {
      await utils.user.getAll.invalidate();
      toast.success("User berhasil dibuat");
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
          <DialogDescription>Buat akun untuk user baru secara manual.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate({ name, email, password, role });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 6 karakter"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "USER" | "ADMIN")}>
              <SelectTrigger className="border-border bg-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Menyimpan..." : "Buat User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ target, onClose }: { target: UserRow | null; onClose: () => void }) {
  const [password, setPassword] = useState("");

  const resetMut = api.user.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password berhasil direset");
      setPassword("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Atur password baru untuk{" "}
            <span className="font-medium text-foreground">
              {target?.name ?? target?.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (target) resetMut.mutate({ userId: target.id, password });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password baru</Label>
            <Input
              id="new-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 6 karakter"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={resetMut.isPending}>
              {resetMut.isPending ? "Menyimpan..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ target, onClose }: { target: UserRow | null; onClose: () => void }) {
  const utils = api.useUtils();
  const deleteMut = api.user.delete.useMutation({
    onSuccess: async () => {
      await utils.user.getAll.invalidate();
      toast.success("User dihapus");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>Hapus User</DialogTitle>
          <DialogDescription>
            Yakin mau menghapus{" "}
            <span className="font-medium text-foreground">{target?.name ?? target?.email}</span>?
            Semua progress quiz, flashcard, dan aktivitasnya ikut terhapus permanen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMut.isPending}
            onClick={() => target && deleteMut.mutate({ userId: target.id })}
          >
            {deleteMut.isPending ? "Menghapus..." : "Hapus Permanen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
