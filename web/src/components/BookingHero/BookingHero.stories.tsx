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

import BookingHero from './BookingHero'

const meta: Meta<typeof BookingHero> = {
  component: BookingHero,
}

export default meta

type Story = StoryObj<typeof BookingHero>

export const Primary: Story = {}
