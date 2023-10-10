import type {
  FutureBookingsQuery,
  FutureBookingsQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { useState } from 'react'
import DatePicker from 'react-datepicker'

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
  const excludedIntervals = [
    { start: new Date(0), end: new Date() },
    ...futureBookings.map(({ startDate, endDate }) => ({
      start: new Date(startDate),
      end: new Date(endDate),
    })),
  ]
  const isValidDates = (start, end) => {
    if (!start || !end) {
      return false
    }
    if (excludedIntervals.length === 0) {
      return true
    }
    for (let i = 0; i < excludedIntervals.length - 1; ++i) {
      const curr = excludedIntervals[i]
      const next = excludedIntervals[i + 1]
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
    const [start, end] = dates
    onChange(start, end, isValidDates(start, end))
  }

  return (
    <DatePicker
      selected={startDate}
      onChange={internalOnChange}
      startDate={startDate}
      endDate={endDate}
      excludeDateIntervals={excludedIntervals}
      selectsRange
      inline
    />
  )
}
