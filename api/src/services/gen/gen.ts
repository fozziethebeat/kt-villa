import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import axios from 'axios'

import { generateImageFromAdapter } from 'src/lib/gen'

export const adminListImageAdapters: QueryResolvers['adminListImageAdapters'] =
  async ({ input }) => {
    return {
      adapters: [],
    }
    /*
    const { data } = await axios.get(`${process.env.IMAGE_API_URL}/sdxl/models`)
    return {
      adapters: data.map(({ name, info }) => ({ name, info })),
    }
    */
  }

export const adminGenerateImage: MutationResolvers['adminGenerateImage'] =
  async ({ input }) => {
    const { image, request } = await generateImageFromAdapter(input.id, {
      variants: [''],
      promptTemplate: input.prompt,
    })
    return { image }
  }
