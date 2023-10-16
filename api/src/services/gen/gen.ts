import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import axios from 'axios'

export const adminListImageAdapters: QueryResolvers['adminListImageAdapters'] =
  async ({ input }) => {
    const { data } = await axios.post(
      'https://image.api.surfacedata.org/sdxl/models'
    )
    return {
      adapters: data.map(({ name, info }) => ({ name, info })),
    }
  }

export const adminGenerateImage: MutationResolvers['adminGenerateImage'] =
  async ({ input }) => {
    console.log(input)
    const { data } = await axios.post(
      'https://image.api.surfacedata.org/sdxl/generate',
      {
        ...input,
      }
    )
    return data
  }
