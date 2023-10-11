import { render } from '@redwoodjs/testing/web'

import AdminBookingCard from './AdminBookingCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('AdminBookingCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<AdminBookingCard />)
    }).not.toThrow()
  })
})
