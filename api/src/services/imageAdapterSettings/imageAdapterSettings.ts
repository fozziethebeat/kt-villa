import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export const imageAdapterSettings: QueryResolvers['imageAdapterSettings'] =
  () => {
    return db.imageAdapterSetting.findMany()
  }

export const imageAdapterSetting: QueryResolvers['imageAdapterSetting'] = ({
  id,
}) => {
  return db.imageAdapterSetting.findUnique({
    where: { id },
  })
}

export const createImageAdapterSetting: MutationResolvers['createImageAdapterSetting'] =
  ({ input }) => {
    return db.imageAdapterSetting.create({
      data: input,
    })
  }

export const updateImageAdapterSetting: MutationResolvers['updateImageAdapterSetting'] =
  ({ id, input }) => {
    return db.imageAdapterSetting.update({
      data: input,
      where: { id },
    })
  }

export const deleteImageAdapterSetting: MutationResolvers['deleteImageAdapterSetting'] =
  ({ id }) => {
    return db.imageAdapterSetting.delete({
      where: { id },
    })
  }
