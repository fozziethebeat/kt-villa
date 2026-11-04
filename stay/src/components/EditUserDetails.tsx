"use client";

import { useRef } from "react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Pencil, Save, X } from "lucide-react";

const UPDATE_USER_DETAILS_MUTATION = gql`
  mutation UpdateUserDetails($input: UpdateUserDetailsInput!) {
    updateUserDetails(input: $input) {
      id
      name
      referral
      socialType
      socialHandle
    }
  }
`;

type EditUserInput = {
  name: string;
  referral: string;
  socialType: string;
  socialHandle: string;
};

export function EditUserDetails({ user }: { user: any }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const form = useForm<EditUserInput>({
    defaultValues: {
      name: user?.name || "",
      referral: user?.referral || "",
      socialType: user?.socialType || "instagram",
      socialHandle: user?.socialHandle || "",
    },
  });

  const [updateUserDetails, { loading, error }] = useMutation(
    UPDATE_USER_DETAILS_MUTATION,
    {
      onCompleted: () => {
        dialogRef.current?.close();
        router.refresh();
      },
    }
  );

  const onSubmit = (data: EditUserInput) => {
    updateUserDetails({
      variables: {
        input: {
          name: data.name,
          referral: data.referral || "Friend",
          socialType: data.socialType || "instagram",
          socialHandle: data.socialHandle || "",
        },
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5 text-primary" />
        Edit Profile
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Edit Guest Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                Update your display name and contact handle
              </p>
            </div>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 space-y-4 text-left"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                {...form.register("name", { required: true })}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-referral"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Referred By
              </label>
              <input
                id="profile-referral"
                type="text"
                className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                {...form.register("referral")}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-socialType"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Contact App
                </label>
                <select
                  id="profile-socialType"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  {...form.register("socialType")}
                >
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="wechat">WeChat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="profile-socialHandle"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Handle / Number
                </label>
                <input
                  id="profile-socialHandle"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="none"
                  placeholder="@handle"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  {...form.register("socialHandle")}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive">
                {error.message || "Could not update profile."}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
