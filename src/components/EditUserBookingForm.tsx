"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";

const MUTATION = gql`
  mutation UpdateBooking($id: Int!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      startDate
      endDate
      maxGuests
      numGuests
      withCat
      withDog
      bookingCode
      status
      item {
        id
        image
        text
      }
    }
  }
`;

export function EditUserBookingForm({ userBooking }) {
  const router = useRouter();
  const [updateBooking, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      router.push(`/booking/${userBooking.bookingCode}`);
    },
  });
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateBooking({
      variables: {
        id: userBooking.id,
        input: {
          maxGuests: parseInt(data.get("maxGuests")),
          numGuests: parseInt(data.get("numGuests")),
        },
      },
    });
  };
  return (
    <div className="min-h-screen w-full bg-base-200">
      <div className="hero-content flex-col items-start lg:flex-row">
        <figure className="h-96 w-96">
          {userBooking?.item ? (
            <img src={userBooking.item.image} />
          ) : (
            <div className="placeholder h-96 w-96 bg-neutral-content" />
          )}
        </figure>
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold">
            Booking Code: {userBooking.bookingCode}
          </h2>
          <div className="flex justify-between gap-2">
            <div>Status</div>
            <div className="badge badge-accent badge-lg">
              {userBooking.status}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Start Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(userBooking.startDate).toLocaleDateString("en-CA")}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>End Date</div>
            <div className="badge badge-ghost badge-lg">
              {new Date(userBooking.endDate).toLocaleDateString("en-CA")}
            </div>
          </div>
          <form onSubmit={onSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Max Guests</span>
              </label>
              <input
                name="maxGuests"
                type="range"
                min="1"
                max="4"
                step="1"
                defaultValue={userBooking?.maxGuests}
                className="range"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Known Guests</span>
              </label>
              <input
                name="numGuests"
                type="range"
                min="1"
                max="5"
                step="1"
                defaultValue={userBooking?.numGuests}
                className="range"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div className="form-control mt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading && <span className="loading loading-spinner" />}
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
