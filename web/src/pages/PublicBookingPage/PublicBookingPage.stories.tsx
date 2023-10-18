import type { Meta, StoryObj } from '@storybook/react'

import PublicBookingPage from './PublicBookingPage'

const meta: Meta<typeof PublicBookingPage> = {
  component: PublicBookingPage,
}

export default meta

type Story = StoryObj<typeof PublicBookingPage>

export const Primary: Story = {}
