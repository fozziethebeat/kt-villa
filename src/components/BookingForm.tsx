'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {gql, useSuspenseQuery, useMutation} from '@apollo/client';
import {useState} from 'react';
import {CalendarIcon} from '@radix-ui/react-icons';
import {addDays, format} from 'date-fns';
import {DateRange} from 'react-day-picker';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

export const QUERY = gql`
  query FutureBookings {
    futureBookings {
      startDate
      endDate
    }
  }
`;

const CREATE_BOOKING_MUTATION = gql`
  mutation CreateBookingMutation($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingCode
    }
  }
`;

export function BookingForm() {
  const now = new Date();
  const [date, setDate] = useState<DateRange>({
    from: now,
    to: new Date(now).setDate(now.getDate() + 2),
  });
  const [isValidDates, setIsValidDates] = useState(false);
  const router = useRouter();
  const form = useForm();
  const {data} = useSuspenseQuery(QUERY);
  const excludedIntervals = data.futureBookings.map(({startDate, endDate}) => ({
    start: new Date(startDate),
    end: new Date(endDate),
  }));
  const [createBooking, {loading, error}] = useMutation(
    CREATE_BOOKING_MUTATION,
    {
      onCompleted: data => {
        router.push(`/booking/${data.createBooking.bookingCode}`);
      },
    },
  );

  const onSubmit = data => {
    createBooking({
      variables: {
        input: {
          startDate: date.from,
          endDate: date.to,
          ...data,
        },
      },
    });
  };

  const validDateMatcher = candidate => {
    return excludedIntervals.some(
      ({start, end}) => candidate >= start && candidate <= end,
    );
  };
  const isValid = (start, end) => {
    if (!start || !end) {
      return false;
    }
    if (excludedIntervals.length === 0) {
      return true;
    }
    for (let i = 0; i < excludedIntervals.length - 1; ++i) {
      const curr = excludedIntervals[i];
      const next = excludedIntervals[i + 1];
      if (end < curr.start) {
        return true;
      }
      if (start <= curr.start && end >= curr.end) {
        return false;
      }
      if (curr.end < start && end < next.start) {
        return true;
      }
    }
    if (end < excludedIntervals[excludedIntervals.length - 1].start) {
      return true;
    }
    return excludedIntervals[excludedIntervals.length - 1].end < start;
  };

  const checkAndSetDate = d => {
    const valid = isValid(d.from, d.to);
    setIsValidDates(valid);
    setDate(d);
  };

  return (
    <div className="my-2">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Trip Dates</span>
        </label>
        <div className="flex justify-center">
          <div className="indicator">
            <div className={cn('grid gap-2')}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-[300px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}>
                    <CalendarIcon />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, 'LLL dd, y')} -{' '}
                          {format(date.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(date.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={checkAndSetDate}
                    numberOfMonths={2}
                    disabled={validDateMatcher}
                    excludeDisabled
                    timeZone="+09:00"
                    footer={
                      <span
                        className={`indicator-bottom badge indicator-item ${
                          isValidDates ? 'badge-primary' : 'badge-accent'
                        }`}>
                        {isValidDates ? 'Valid' : 'Invalid'}
                      </span>
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
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
