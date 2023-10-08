import type { Prisma, StableItem } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.StableItemCreateArgs>({
  stableItem: {
    one: { data: { id: 'String', image: 'String', text: 'String' } },
    two: { data: { id: 'String', image: 'String', text: 'String' } },
  },
})

export type StandardScenario = ScenarioData<StableItem, 'stableItem'>
