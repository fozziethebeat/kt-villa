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

import UserBookingCard from './UserBookingCard'

const meta: Meta<typeof UserBookingCard> = {
  component: UserBookingCard,
}

export default meta

type Story = StoryObj<typeof UserBookingCard>

export const Primary: Story = {}
