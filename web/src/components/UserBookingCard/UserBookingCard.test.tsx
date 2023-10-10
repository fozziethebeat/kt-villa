import { render } from '@redwoodjs/testing/web'

import UserBookingCard from './UserBookingCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('UserBookingCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<UserBookingCard />)
    }).not.toThrow()
  })
})
