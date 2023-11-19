import { render } from '@redwoodjs/testing/web'

import EditUserBookingPage from './EditUserBookingPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('EditUserBookingPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<EditUserBookingPage />)
    }).not.toThrow()
  })
})
