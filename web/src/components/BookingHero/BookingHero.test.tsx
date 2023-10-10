import { render } from '@redwoodjs/testing/web'

import BookingHero from './BookingHero'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('BookingHero', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<BookingHero />)
    }).not.toThrow()
  })
})
