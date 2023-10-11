import { render } from '@redwoodjs/testing/web'

import ReviewBookingsPage from './ReviewBookingsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ReviewBookingsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ReviewBookingsPage />)
    }).not.toThrow()
  })
})
