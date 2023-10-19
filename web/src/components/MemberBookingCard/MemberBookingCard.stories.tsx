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

import MemberBookingCard from './MemberBookingCard'

const meta: Meta<typeof MemberBookingCard> = {
  component: MemberBookingCard,
}

export default meta

type Story = StoryObj<typeof MemberBookingCard>

export const Primary: Story = {}
