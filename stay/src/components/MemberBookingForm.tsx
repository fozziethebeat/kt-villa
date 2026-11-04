"use client";

import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Check, Clock, Loader2, X } from "lucide-react";

const MUTATION = gql`
  mutation UpdateMemberBookingStatus($id: Int!, $status: String!) {
    updateMemberBookingStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export function MemberBookingForm({
  memberBooking,
}: {
  memberBooking: { id: number; status: string };
  booking?: any;
}) {
  const router = useRouter();
  const [updateMemberBookingStatus, { loading }] = useMutation(MUTATION, {
    onCompleted: () => {
      router.refresh();
    },
  });

  const handleSetStatus = (nextStatus: string) => {
    if (nextStatus === memberBooking.status) return;
    updateMemberBookingStatus({
      variables: {
        id: memberBooking.id,
        status: nextStatus,
      },
    });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => handleSetStatus("approved")}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
          memberBooking.status === "approved"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        <Check className="h-3 w-3" />
        Approved
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => handleSetStatus("pending")}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
          memberBooking.status === "pending"
            ? "bg-amber-600 text-white shadow-sm"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        <Clock className="h-3 w-3" />
        Pending
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() => handleSetStatus("rejected")}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
          memberBooking.status === "rejected"
            ? "bg-red-600 text-white shadow-sm"
            : "text-foreground/70 hover:bg-muted hover:text-foreground"
        }`}
      >
        <X className="h-3 w-3" />
        Rejected
      </button>

      {loading && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
