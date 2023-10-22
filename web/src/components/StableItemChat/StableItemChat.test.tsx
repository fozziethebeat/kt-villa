import { render } from '@redwoodjs/testing/web'

import StableItemChat from './StableItemChat'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('StableItemChat', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<StableItemChat />)
    }).not.toThrow()
  })
})
