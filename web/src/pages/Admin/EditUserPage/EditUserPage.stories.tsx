import type { Meta, StoryObj } from '@storybook/react'

import EditUserPage from './EditUserPage'

const meta: Meta<typeof EditUserPage> = {
  component: EditUserPage,
}

export default meta

type Story = StoryObj<typeof EditUserPage>

export const Primary: Story = {}
