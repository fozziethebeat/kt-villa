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

import StableItemCard from './StableItemCard'

const meta: Meta<typeof StableItemCard> = {
  component: StableItemCard,
}

export default meta

type Story = StoryObj<typeof StableItemCard>

export const Primary: Story = {}
