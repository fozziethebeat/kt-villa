import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export const signupCodes: QueryResolvers['signupCodes'] = () => {
  return db.signupCode.findMany()
}

export const signupCode: QueryResolvers['signupCode'] = ({ id }) => {
  return db.signupCode.findUnique({
    where: { id },
  })
}

export const createSignupCode: MutationResolvers['createSignupCode'] = ({
  input,
}) => {
  return db.signupCode.create({
    data: input,
  })
}

export const updateSignupCode: MutationResolvers['updateSignupCode'] = ({
  id,
  input,
}) => {
  return db.signupCode.update({
    data: input,
    where: { id },
  })
}

export const deleteSignupCode: MutationResolvers['deleteSignupCode'] = ({
  id,
}) => {
  return db.signupCode.delete({
    where: { id },
  })
}
