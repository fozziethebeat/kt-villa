import type { Meta, StoryObj } from '@storybook/react'

import EditBookingsPage from './EditBookingsPage'

const meta: Meta<typeof EditBookingsPage> = {
  component: EditBookingsPage,
}

export default meta

type Story = StoryObj<typeof EditBookingsPage>

export const Primary: Story = {}
