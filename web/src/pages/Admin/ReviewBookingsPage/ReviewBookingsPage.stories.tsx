import type { Meta, StoryObj } from '@storybook/react'

import ReviewBookingsPage from './ReviewBookingsPage'

const meta: Meta<typeof ReviewBookingsPage> = {
  component: ReviewBookingsPage,
}

export default meta

type Story = StoryObj<typeof ReviewBookingsPage>

export const Primary: Story = {}
