import { render } from '@redwoodjs/testing/web'

import ClaimForm from './ClaimForm'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('ClaimForm', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ClaimForm />)
    }).not.toThrow()
  })
})
