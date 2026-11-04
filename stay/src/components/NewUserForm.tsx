"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Loader2, UserPlus } from "lucide-react";

const MUTATION = gql`
  mutation UpdateUserDetails($input: UpdateUserDetailsInput!) {
    updateUserDetails(input: $input) {
      id
    }
  }
`;

type UpdateUserDetails = {
  name: string;
  referral: string;
  socialType: string;
  socialHandle: string;
};

const SOCIAL_TYPES = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "wechat", label: "WeChat" },
];

export function NewUserForm() {
  const router = useRouter();
  const form = useForm<UpdateUserDetails>({
    defaultValues: {
      name: "",
      referral: "",
      socialType: "instagram",
      socialHandle: "",
    },
  });

  const selectedSocialType = form.watch("socialType");

  const [update, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      router.refresh();
    },
  });

  const onSubmit = (data: UpdateUserDetails) => {
    update({
      variables: {
        input: data,
      },
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="w-full space-y-4 text-left"
    >
      <div className="border-b border-border/80 pb-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Complete Your Guest Profile
        </h2>
        <p className="text-xs text-muted-foreground">
          Let Keith &amp; Jon know who you are so we can approve your stays.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="onboard-name"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Your Full Name
        </label>
        <input
          type="text"
          id="onboard-name"
          autoComplete="name"
          placeholder="e.g. Alex Tanaka"
          required
          className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...form.register("name", { required: true })}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="onboard-referral"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Who Referred You?
        </label>
        <input
          type="text"
          id="onboard-referral"
          placeholder="e.g. Keith, Jon, or mutual friend"
          required
          className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...form.register("referral", { required: true })}
        />
      </div>

      <fieldset className="space-y-1.5">
        <legend className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preferred Messaging App
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {SOCIAL_TYPES.map((st) => {
            const active = selectedSocialType === st.value;
            return (
              <label
                key={st.value}
                className={`flex cursor-pointer items-center justify-center rounded-xl border py-2 text-xs font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  value={st.value}
                  className="sr-only"
                  {...form.register("socialType")}
                />
                {st.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor="onboard-socialHandle"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Handle or Phone Number
        </label>
        <input
          type="text"
          id="onboard-socialHandle"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="@username or +81..."
          required
          className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          {...form.register("socialHandle", { required: true })}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error.message || "Could not save profile details."}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving Profile...</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Save &amp; Continue to Booking</span>
          </>
        )}
      </button>
    </form>
  );
}
