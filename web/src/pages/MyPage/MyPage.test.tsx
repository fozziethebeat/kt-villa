import { render } from '@redwoodjs/testing/web'

import MyPage from './MyPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('MyPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<MyPage />)
    }).not.toThrow()
  })
})
