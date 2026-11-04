"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const UPDATE_USER_MUTATION = gql`
  mutation AdminQuickUpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      roles
      trustStatus
    }
  }
`;

export function AdminUsersTableClient({ users }: { users: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [updateUser] = useMutation(UPDATE_USER_MUTATION, {
    onCompleted: () => {
      setBusyId(null);
      router.refresh();
    },
    onError: () => {
      setBusyId(null);
    },
  });

  const handleToggleTrust = (user: any) => {
    const nextTrust = user.trustStatus === "trusted" ? "new" : "trusted";
    setBusyId(user.id);
    updateUser({
      variables: {
        id: user.id,
        input: { trustStatus: nextTrust },
      },
    });
  };

  const handleRoleChange = (user: any, nextRole: string) => {
    setBusyId(user.id);
    updateUser({
      variables: {
        id: user.id,
        input: { roles: nextRole },
      },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.referral?.toLowerCase().includes(q) ||
        u.socialHandle?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs font-medium text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} registered users
        </p>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, referral..."
            className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="responsive-table-wrapper rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Guest &amp; Email</th>
              <th className="px-4 py-3">Referral &amp; Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Trust Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const isBusy = busyId === user.id;
              return (
                <tr key={user.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground">
                      {user.name || "No Profile Name Yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {user.id}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {user.referral ? (
                      <p className="text-foreground">
                        Ref: <span className="font-semibold">{user.referral}</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No referral listed</p>
                    )}
                    {user.socialHandle && (
                      <p className="text-muted-foreground">
                        {user.socialType}: {user.socialHandle}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      disabled={isBusy}
                      value={user.roles || "general"}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold capitalize text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="general">general</option>
                      <option value="trusted">trusted</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleTrust(user)}
                      title="Click to toggle trust status"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                        user.trustStatus === "trusted"
                          ? "bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25"
                          : "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25"
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : user.trustStatus === "trusted" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {user.trustStatus || "new"}
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/user/${user.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
