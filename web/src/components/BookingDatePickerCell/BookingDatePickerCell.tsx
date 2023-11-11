import type {
  FutureBookingsQuery,
  FutureBookingsQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import moment from 'moment-timezone'
import { useState } from 'react'
import {
  isSameDay,
  DateRangePicker,
  DayPickerRangeController,
} from 'react-dates'

moment.tz.setDefault('Asia/Tokyo')

export const QUERY = gql`
  query FutureBookings {
    futureBookings {
      startDate
      endDate
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FutureBookingsQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  futureBookings,
  startDate,
  endDate,
  onChange,
}: CellSuccessProps<FutureBookingsQuery, FutureBookingsQueryVariables>) => {
  const [focusedInput, setFocusedInput] = useState(null)
  const excludedIntervals = [
    ...futureBookings.map(({ startDate, endDate }) => ({
      start: new Date(startDate),
      end: new Date(endDate),
    })),
  ]
  const isDayBlocked = (d) => {
    const candidateDate = d.toDate()
    return excludedIntervals.some(
      ({ start, end }) => candidateDate >= start && candidateDate <= end
    )
  }

  const isValidDates = (s, e) => {
    if (!s || !e) {
      return false
    }
    if (excludedIntervals.length === 0) {
      return true
    }
    const start = s.toDate()
    const end = e.toDate()
    for (let i = 0; i < excludedIntervals.length - 1; ++i) {
      const curr = excludedIntervals[i]
      const next = excludedIntervals[i + 1]
      if (end < curr.start) {
        return true
      }
      if (start <= curr.start && end >= curr.end) {
        return false
      }
      if (curr.end < start && end < next.start) {
        return true
      }
    }
    return excludedIntervals[excludedIntervals.length - 1].end < start
  }

  const internalOnChange = (dates) => {
    const { startDate: start, endDate: end } = dates
    onChange(start, end, isValidDates(start, end))
  }

  return (
    <DateRangePicker
      startDate={startDate}
      startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
      endDate={endDate}
      endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
      onDatesChange={internalOnChange}
      isDayBlocked={isDayBlocked}
      focusedInput={focusedInput}
      onFocusChange={setFocusedInput}
    />
  )
}
