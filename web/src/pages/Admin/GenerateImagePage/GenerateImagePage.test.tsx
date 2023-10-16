import { render } from '@redwoodjs/testing/web'

import GenerateImagePage from './GenerateImagePage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('GenerateImagePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<GenerateImagePage />)
    }).not.toThrow()
  })
})
