import type { Meta, StoryObj } from '@storybook/react'

import ItemPage from './ItemPage'

const meta: Meta<typeof ItemPage> = {
  component: ItemPage,
}

export default meta

type Story = StoryObj<typeof ItemPage>

export const Primary: Story = {}
