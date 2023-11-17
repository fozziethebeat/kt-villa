import type { Meta, StoryObj } from '@storybook/react'

import UserPage from './UserPage'

const meta: Meta<typeof UserPage> = {
  component: UserPage,
}

export default meta

type Story = StoryObj<typeof UserPage>

export const Primary: Story = {}
