import type { Meta, StoryObj } from '@storybook/react'

import GenerateImagePage from './GenerateImagePage'

const meta: Meta<typeof GenerateImagePage> = {
  component: GenerateImagePage,
}

export default meta

type Story = StoryObj<typeof GenerateImagePage>

export const Primary: Story = {}
