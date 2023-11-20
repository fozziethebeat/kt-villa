import { render } from '@redwoodjs/testing/web'

import PublicBookingCard from './PublicBookingCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('PublicBookingCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PublicBookingCard />)
    }).not.toThrow()
  })
})
