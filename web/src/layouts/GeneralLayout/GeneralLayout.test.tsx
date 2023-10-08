import { render } from '@redwoodjs/testing/web'

import GeneralLayout from './GeneralLayout'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('GeneralLayout', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<GeneralLayout />)
    }).not.toThrow()
  })
})
