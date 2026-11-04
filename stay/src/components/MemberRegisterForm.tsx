"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, UserPlus } from "lucide-react";

const MUTATION = gql`
  mutation addMemberBooking($id: Int!, $username: String!) {
    addMemberBooking(id: $id, username: $username) {
      id
      status
    }
  }
`;

interface MemberRegisterInput {
  username: string;
}

export function MemberRegisterForm({ booking }: { booking: { id: number } }) {
  const router = useRouter();
  const { handleSubmit, register, reset } = useForm<MemberRegisterInput>();
  const [addMemberBooking, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      reset();
      router.refresh();
    },
  });

  const onSubmit = (data: MemberRegisterInput) => {
    if (!data.username?.trim()) return;
    addMemberBooking({
      variables: {
        id: booking.id,
        username: data.username.trim(),
      },
    });
  };

  return (
    <div className="space-y-1.5">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          placeholder="Friend's registered name (e.g. Alex Tanaka)"
          className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...register("username", { required: true })}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          <span>Add Co-Traveler</span>
        </button>
      </form>
      {error && (
        <p className="text-xs text-destructive">
          {error.message || "Could not find a registered user with that name."}
        </p>
      )}
    </div>
  );
}
