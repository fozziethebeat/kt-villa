// Pass props to your component by passing an `args` object to your story
//
// ```tsx
// export const Primary: Story = {
//  args: {
//    propName: propValue
//  }
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { Meta, StoryObj } from '@storybook/react'

import StableItemChat from './StableItemChat'

const meta: Meta<typeof StableItemChat> = {
  component: StableItemChat,
}

export default meta

type Story = StoryObj<typeof StableItemChat>

export const Primary: Story = {}
