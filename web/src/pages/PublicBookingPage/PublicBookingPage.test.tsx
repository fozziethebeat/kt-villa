import { render } from '@redwoodjs/testing/web'

import PublicBookingPage from './PublicBookingPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('PublicBookingPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PublicBookingPage bookingCode={'42'} />)
    }).not.toThrow()
  })
})
