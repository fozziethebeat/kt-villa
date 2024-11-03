'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {gql, useMutation} from '@apollo/client';
import {useState} from 'react';

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBookingMutation($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingCode
    }
  }
`;

function BookingForm() {
  const router = useRouter();
  const form = useForm();
  const [createBooking, {loading, error}] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: data => {
        router.push(`/booking${data.createBooking.bookingCode}`);
      },
    },
  );

  const onSubmit = data => {
    createBooking({
      variables: {
        input: {
          startDate,
          endDate,
          ...data,
        },
      },
    });
  };

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isValidDates, setIsValidDates] = useState(false);

  const onChange = (newStart, newEnd, isValid) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setIsValidDates(isValid);
  };

  return (
    <div className="my-2">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Trip Dates</span>
        </label>
        <div className="flex justify-center">
          <div className="indicator">
            {/*
            <BookingDatePickerCell
              className="place-items-center"
              startDate={startDate}
              endDate={endDate}
              onChange={onChange}
            />
*/}
            <span
              className={`indicator-bottom badge indicator-item ${
                isValidDates ? 'badge-primary' : 'badge-accent'
              }`}>
              {isValidDates ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Max Guests</span>
          </label>
          <input
            type="range"
            name="maxGuests"
            min={1}
            max={5}
            defaultValue={4}
            className="range"
            step="1"
            {...form.register('maxGuests', {valueAsNumber: true})}
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
            type="range"
            name="numGuests"
            min={1}
            max={5}
            defaultValue={1}
            className="range"
            step="1"
            {...form.register('numGuests', {valueAsNumber: true})}
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
            disabled={!isValidDates || loading}
            type="submit"
            className="btn btn-primary btn-sm">
            {loading && <span className="loading loading-spinner" />}
            Book
          </button>
        </div>
      </form>
    </div>
  );
}
