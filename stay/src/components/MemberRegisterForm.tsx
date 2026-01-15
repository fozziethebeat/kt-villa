'use client';

import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

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

export function MemberRegisterForm({ booking }) {
  const { handleSubmit, register } = useForm<MemberRegisterInput>();
  const [addMemberBooking, { loading, error }] = useMutation(MUTATION);
  const onSubmit = data => {
    addMemberBooking({
      variables: {
        id: booking.id,
        username: data.username,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 p-2">
      <div className="form-control w-full max-w-xs">
        <input
          type="search"
          name="username"
          autoComplete="off"
          aria-autocomplete="none"
          className="input input-bordered w-full max-w-xs"
          placeholder="Username"
          {...register('username')}
        />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading && <span className="loading loading-spinner"></span>}
        Register
      </button>
    </form>
  );
}
