import { render } from '@redwoodjs/testing/web'

import PublicBookingsPage from './PublicBookingsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('PublicBookingsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PublicBookingsPage />)
    }).not.toThrow()
  })
})
