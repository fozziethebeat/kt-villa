import type { Meta, StoryObj } from '@storybook/react'

import PublicBookingsPage from './PublicBookingsPage'

const meta: Meta<typeof PublicBookingsPage> = {
  component: PublicBookingsPage,
}

export default meta

type Story = StoryObj<typeof PublicBookingsPage>

export const Primary: Story = {}
