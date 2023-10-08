import { render } from '@redwoodjs/testing/web'

import StableItemCard from './StableItemCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('StableItemCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<StableItemCard />)
    }).not.toThrow()
  })
})
