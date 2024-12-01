"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";

const MUTATION = gql`
  mutation addMemberBooking($id: Int!, $username: String!) {
    addMemberBooking(id: $id, username: $username) {
      id
      status
    }
  }
`;

export function MemberRegisterForm({ booking }) {
  const [addMemberBooking, { loading, error }] = useMutation(MUTATION, {
    /*
    refetchQueries: [
      { query: QUERY, variables: { bookingCode: booking.bookingCode } },
    ],
     */
  });
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addMemberBooking({
      variables: {
        id: booking.id,
        username: data.get("username"),
      },
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 p-2">
      <div className="form-control w-full max-w-xs">
        <input
          type="search"
          name="username"
          autoComplete="off"
          aria-autocomplete="none"
          className="input input-bordered w-full max-w-xs"
          placeholder="Username"
        />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading && <span className="loading loading-spinner"></span>}
        Register
      </button>
    </form>
  );
}
