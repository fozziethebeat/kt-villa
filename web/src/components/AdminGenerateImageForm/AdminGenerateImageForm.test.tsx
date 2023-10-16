import { render } from '@redwoodjs/testing/web'

import AdminGenerateImageForm from './AdminGenerateImageForm'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('AdminGenerateImageForm', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<AdminGenerateImageForm />)
    }).not.toThrow()
  })
})
