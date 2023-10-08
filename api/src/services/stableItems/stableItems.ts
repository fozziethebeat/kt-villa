import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import ShortUniqueId from 'short-unique-id'

import { db } from 'src/lib/db'

const uid = new ShortUniqueId({ length: 10 })
export const stableItems: QueryResolvers['stableItems'] = () => {
  return db.stableItem.findMany()
}

export const stableItem: QueryResolvers['stableItem'] = ({ id }) => {
  return db.stableItem.findUnique({
    where: { id },
  })
}

export const createStableItem: MutationResolvers['createStableItem'] = ({
  input,
}) => {
  return db.stableItem.create({
    data: {
      ...input,
      id: uid.rnd(),
    },
  })
}

export const updateStableItem: MutationResolvers['updateStableItem'] = ({
  id,
  input,
}) => {
  return db.stableItem.update({
    data: input,
    where: { id },
  })
}

export const deleteStableItem: MutationResolvers['deleteStableItem'] = ({
  id,
}) => {
  return db.stableItem.delete({
    where: { id },
  })
}
