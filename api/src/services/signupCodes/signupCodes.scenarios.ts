import type { Prisma, SignupCode } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.SignupCodeCreateArgs>({
  signupCode: {
    one: { data: { id: 'String' } },
    two: { data: { id: 'String' } },
  },
})

export type StandardScenario = ScenarioData<SignupCode, 'signupCode'>
