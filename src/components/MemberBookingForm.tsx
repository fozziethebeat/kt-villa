'use client';

import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {gql, useSuspenseQuery, useMutation} from '@apollo/client';

const MUTATION = gql`
  mutation UpdateMemberBookingStatus($id: Int!, $status: String!) {
    updateMemberBookingStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

type MemberBookingInput = {
  status: string;
};

export function MemberBookingForm({memberBooking, booking}) {
  const {handleSubmit, register} = useForm<MemberBookingInput>({
    defaultValues: {
      status: memberBooking.status,
    },
  });
  const [updateMemberBookingStatus, {loading, error}] = useMutation(MUTATION, {
    onCompleted: () => {
      router.refresh();
    },
  });
  const onSave = data => {
    updateMemberBookingStatus({
      variables: {
        id: memberBooking.id,
        status: data.status,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select
        name="status"
        defaultValue={memberBooking.status}
        className="select select-bordered"
        {...register('status')}>
        <option>approved</option>
        <option>pending</option>
        <option>rejected</option>
      </select>

      <div>
        <button disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner" />}
          Update
        </button>
      </div>
    </form>
  );
}
