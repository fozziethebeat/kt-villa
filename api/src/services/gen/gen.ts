import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import axios from 'axios'

export const adminListImageAdapters: QueryResolvers['adminListImageAdapters'] =
  async ({ input }) => {
    const { data } = await axios.get(`${process.env.IMAGE_API_URL}/sdxl/models`)
    return {
      adapters: data.map(({ name, info }) => ({ name, info })),
    }
  }

export const adminGenerateImage: MutationResolvers['adminGenerateImage'] =
  async ({ input }) => {
    const { data } = await axios.post(
      `${process.env.IMAGE_API_URL}/sdxl/generate`,
      {
        ...input,
      }
    )
    return data
  }
