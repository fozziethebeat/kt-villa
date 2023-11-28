import { render } from '@redwoodjs/testing/web'

import EditBookingsPage from './EditBookingsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('EditBookingsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<EditBookingsPage id={42} />)
    }).not.toThrow()
  })
})
