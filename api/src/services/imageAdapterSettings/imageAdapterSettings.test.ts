import type { ImageAdapterSetting } from '@prisma/client'

import {
  imageAdapterSettings,
  imageAdapterSetting,
  createImageAdapterSetting,
  updateImageAdapterSetting,
  deleteImageAdapterSetting,
} from './imageAdapterSettings'
import type { StandardScenario } from './imageAdapterSettings.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('imageAdapterSettings', () => {
  scenario(
    'returns all imageAdapterSettings',
    async (scenario: StandardScenario) => {
      const result = await imageAdapterSettings()

      expect(result.length).toEqual(
        Object.keys(scenario.imageAdapterSetting).length
      )
    }
  )

  scenario(
    'returns a single imageAdapterSetting',
    async (scenario: StandardScenario) => {
      const result = await imageAdapterSetting({
        id: scenario.imageAdapterSetting.one.id,
      })

      expect(result).toEqual(scenario.imageAdapterSetting.one)
    }
  )

  scenario('creates a imageAdapterSetting', async () => {
    const result = await createImageAdapterSetting({
      input: { startDate: '2023-10-17T07:29:22.575Z', adapter: 'String' },
    })

    expect(result.startDate).toEqual(new Date('2023-10-17T07:29:22.575Z'))
    expect(result.adapter).toEqual('String')
  })

  scenario(
    'updates a imageAdapterSetting',
    async (scenario: StandardScenario) => {
      const original = (await imageAdapterSetting({
        id: scenario.imageAdapterSetting.one.id,
      })) as ImageAdapterSetting
      const result = await updateImageAdapterSetting({
        id: original.id,
        input: { startDate: '2023-10-18T07:29:22.575Z' },
      })

      expect(result.startDate).toEqual(new Date('2023-10-18T07:29:22.575Z'))
    }
  )

  scenario(
    'deletes a imageAdapterSetting',
    async (scenario: StandardScenario) => {
      const original = (await deleteImageAdapterSetting({
        id: scenario.imageAdapterSetting.one.id,
      })) as ImageAdapterSetting
      const result = await imageAdapterSetting({ id: original.id })

      expect(result).toEqual(null)
    }
  )
})
