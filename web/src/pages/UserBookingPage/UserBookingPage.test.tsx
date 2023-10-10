import { render } from '@redwoodjs/testing/web'

import UserBookingPage from './UserBookingPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('UserBookingPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<UserBookingPage bookingCode={'42'} />)
    }).not.toThrow()
  })
})
