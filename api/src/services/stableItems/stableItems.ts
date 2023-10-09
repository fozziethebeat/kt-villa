import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { validateWith } from '@redwoodjs/api'
import ShortUniqueId from 'short-unique-id'

import { db } from 'src/lib/db'

enum ClaimStatus {
  CLAIMED = 'claimed',
  UNCLAIMED = 'unclaimed',
}

const uid = new ShortUniqueId({ length: 10 })

export const stableItems: QueryResolvers['stableItems'] = () => {
  return db.stableItem.findMany()
}

export const stableItem: QueryResolvers['stableItem'] = ({ id }) => {
  return db.stableItem.findUnique({
    where: { id },
  })
}

export const claimItem: MutationResolvers['claimItem'] = async ({ input }) => {
  const { id, code } = input
  await validateWith(async () => {
    const item = await db.stableItem.findUnique({
      where: { id },
      select: {
        claimCode: true,
        claimStatus: true,
        owner: true,
      },
    })
    if (!item) {
      throw 'No item found'
    }
    if (item.claimStatus !== ClaimStatus.UNCLAIMED) {
      throw 'Item already claimed'
    }
    if (item.claimCode !== code) {
      throw 'Invalid claim code'
    }
  })
  return db.stableItem.update({
    data: {
      claimStatus: ClaimStatus.CLAIMED,
      ownerId: context.currentUser.id,
    },
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
