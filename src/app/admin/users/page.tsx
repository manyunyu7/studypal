"use client";

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
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

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

  const updateRoleMut = api.user.updateRole.useMutation({
    onSuccess: async () => {
      await utils.user.getAll.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Kelola akun pengguna dan role</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Bergabung</TableHead>
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
            {!isLoading && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada pengguna.
                </TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-accent">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">
                        {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{user.name ?? "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role as string}
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
                        <SelectItem
                          value="USER"
                          className="text-foreground focus:bg-accent focus:text-foreground"
                        >
                          USER
                        </SelectItem>
                        <SelectItem
                          value="ADMIN"
                          className="text-foreground focus:bg-accent focus:text-foreground"
                        >
                          ADMIN
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {(user.role as string) === "ADMIN" && (
                      <Badge className="bg-primary/15 text-primary">Admin</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt ? formatDate(user.createdAt) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
