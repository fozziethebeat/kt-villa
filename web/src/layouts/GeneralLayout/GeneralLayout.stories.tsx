import type { Meta, StoryObj } from '@storybook/react'

import GeneralLayout from './GeneralLayout'

const meta: Meta<typeof GeneralLayout> = {
  component: GeneralLayout,
}

export default meta

type Story = StoryObj<typeof GeneralLayout>

export const Primary: Story = {}
