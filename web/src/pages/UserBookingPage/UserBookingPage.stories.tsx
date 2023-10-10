import type { Meta, StoryObj } from '@storybook/react'

import UserBookingPage from './UserBookingPage'

const meta: Meta<typeof UserBookingPage> = {
  component: UserBookingPage,
}

export default meta

type Story = StoryObj<typeof UserBookingPage>

export const Primary: Story = {}
