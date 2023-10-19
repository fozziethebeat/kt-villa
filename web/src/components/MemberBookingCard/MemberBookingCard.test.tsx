import { render } from '@redwoodjs/testing/web'

import MemberBookingCard from './MemberBookingCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('MemberBookingCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<MemberBookingCard />)
    }).not.toThrow()
  })
})
