import type { SignupCode } from '@prisma/client'

import {
  signupCodes,
  signupCode,
  createSignupCode,
  updateSignupCode,
  deleteSignupCode,
} from './signupCodes'
import type { StandardScenario } from './signupCodes.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('signupCodes', () => {
  scenario('returns all signupCodes', async (scenario: StandardScenario) => {
    const result = await signupCodes()

    expect(result.length).toEqual(Object.keys(scenario.signupCode).length)
  })

  scenario(
    'returns a single signupCode',
    async (scenario: StandardScenario) => {
      const result = await signupCode({ id: scenario.signupCode.one.id })

      expect(result).toEqual(scenario.signupCode.one)
    }
  )

  scenario('creates a signupCode', async () => {
    const result = await createSignupCode({
      input: { id: 'String' },
    })

    expect(result.id).toEqual('String')
  })

  scenario('updates a signupCode', async (scenario: StandardScenario) => {
    const original = (await signupCode({
      id: scenario.signupCode.one.id,
    })) as SignupCode
    const result = await updateSignupCode({
      id: original.id,
      input: { id: 'String2' },
    })

    expect(result.id).toEqual('String2')
  })

  scenario('deletes a signupCode', async (scenario: StandardScenario) => {
    const original = (await deleteSignupCode({
      id: scenario.signupCode.one.id,
    })) as SignupCode
    const result = await signupCode({ id: original.id })

    expect(result).toEqual(null)
  })
})
