import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import axios from 'axios'

export const adminGenerateImage: MutationResolvers['adminGenerateImage'] =
  async ({ input }) => {
    const { data } = await axios.post(
      'https://image.api.surfacedata.org/sdxl/generate',
      {
        ...input,
        num_inference_steps: 5,
        lora: 'by-makoto-shinkai',
      }
    )
    return data
  }
