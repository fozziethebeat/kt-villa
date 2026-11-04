"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";

const MUTATION = gql`
  mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      roles
      trustStatus
    }
  }
`;

type EditUserInput = {
  id: string;
  name: string;
  email: string;
  roles: string;
  trustStatus: string;
};

export function EditUserForm({ user }: { user: any }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const form = useForm<EditUserInput>({
    defaultValues: {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      roles: user.roles || "general",
      trustStatus: user.trustStatus || "new",
    },
  });

  const [updateUser, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    },
  });

  const onSubmit = (data: EditUserInput) => {
    updateUser({
      variables: {
        id: user.id,
        input: {
          name: data.name,
          email: data.email,
          roles: data.roles,
          trustStatus: data.trustStatus,
        },
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin?view=users"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Users
        </Link>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Admin User Management
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {user.name || "Unnamed User"}
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              ID: {user.id}
            </p>
          </div>

          {saved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-user-name"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Display Name
            </label>
            <input
              id="admin-user-name"
              type="text"
              className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
              {...form.register("name")}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-user-email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email Address
            </label>
            <input
              id="admin-user-email"
              type="email"
              className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
              {...form.register("email")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-user-roles"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Role
            </label>
            <select
              id="admin-user-roles"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              {...form.register("roles")}
            >
              <option value="general">General</option>
              <option value="trusted">Trusted</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-user-trust"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Trust Status
            </label>
            <select
              id="admin-user-trust"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              {...form.register("trustStatus")}
            >
              <option value="new">New</option>
              <option value="trusted">Trusted</option>
            </select>
          </div>
        </div>

        {(user.referral || user.socialHandle) && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold uppercase tracking-wider text-foreground">
              Onboarding Details
            </p>
            <p className="mt-1">
              Referred by:{" "}
              <strong className="text-foreground">
                {user.referral || "N/A"}
              </strong>{" "}
              · Contact:{" "}
              <strong className="text-foreground">
                {user.socialType || "N/A"} ({user.socialHandle || "N/A"})
              </strong>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            {error.message || "Could not update user."}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save User Details</span>
          </button>
        </div>
      </form>
    </div>
  );
}
