"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";

const REQUEST_JOIN_MUTATION = gql`
  mutation RequestJoinBooking($bookingId: Int!) {
    requestJoinBooking(bookingId: $bookingId) {
      id
      status
    }
  }
`;

export function PublicBookingActions({
  bookingId,
  hasOpenSpots,
  alreadyRequestedStatus,
}: {
  bookingId: number;
  hasOpenSpots: boolean;
  alreadyRequestedStatus?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(
    alreadyRequestedStatus ?? null
  );

  const [requestJoin, { loading, error }] = useMutation(REQUEST_JOIN_MUTATION, {
    onCompleted: (res: any) => {
      setStatus(res?.requestJoinBooking?.status || "pending");
      router.refresh();
    },
  });

  if (status) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-900">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
        <span>
          Your request to join this trip is{" "}
          <strong className="font-bold capitalize">{status}</strong>.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!hasOpenSpots || loading}
        onClick={() => requestJoin({ variables: { bookingId } })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending Join Request...</span>
          </>
        ) : hasOpenSpots ? (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Request to Join This Trip</span>
          </>
        ) : (
          <span>Trip is at Max Capacity</span>
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive">
          {error.message || "Unable to request joining this booking."}
        </p>
      )}
    </div>
  );
}
