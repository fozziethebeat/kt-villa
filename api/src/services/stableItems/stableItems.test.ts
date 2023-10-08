import type { StableItem } from '@prisma/client'

import {
  stableItems,
  stableItem,
  createStableItem,
  updateStableItem,
  deleteStableItem,
} from './stableItems'
import type { StandardScenario } from './stableItems.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('stableItems', () => {
  scenario('returns all stableItems', async (scenario: StandardScenario) => {
    const result = await stableItems()

    expect(result.length).toEqual(Object.keys(scenario.stableItem).length)
  })

  scenario(
    'returns a single stableItem',
    async (scenario: StandardScenario) => {
      const result = await stableItem({ id: scenario.stableItem.one.id })

      expect(result).toEqual(scenario.stableItem.one)
    }
  )

  scenario('creates a stableItem', async () => {
    const result = await createStableItem({
      input: { id: 'String', image: 'String', text: 'String' },
    })

    expect(result.id).toEqual('String')
    expect(result.image).toEqual('String')
    expect(result.text).toEqual('String')
  })

  scenario('updates a stableItem', async (scenario: StandardScenario) => {
    const original = (await stableItem({
      id: scenario.stableItem.one.id,
    })) as StableItem
    const result = await updateStableItem({
      id: original.id,
      input: { id: 'String2' },
    })

    expect(result.id).toEqual('String2')
  })

  scenario('deletes a stableItem', async (scenario: StandardScenario) => {
    const original = (await deleteStableItem({
      id: scenario.stableItem.one.id,
    })) as StableItem
    const result = await stableItem({ id: original.id })

    expect(result).toEqual(null)
  })
})
