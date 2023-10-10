import type { Meta, StoryObj } from '@storybook/react'

import MyPage from './MyPage'

const meta: Meta<typeof MyPage> = {
  component: MyPage,
}

export default meta

type Story = StoryObj<typeof MyPage>

export const Primary: Story = {}
