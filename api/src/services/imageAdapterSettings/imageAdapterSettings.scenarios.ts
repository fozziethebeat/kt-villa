import type { Prisma, ImageAdapterSetting } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.ImageAdapterSettingCreateArgs>({
  imageAdapterSetting: {
    one: { data: { startDate: '2023-10-17T07:29:22.584Z', adapter: 'String' } },
    two: { data: { startDate: '2023-10-17T07:29:22.584Z', adapter: 'String' } },
  },
})

export type StandardScenario = ScenarioData<
  ImageAdapterSetting,
  'imageAdapterSetting'
>
