import axios from 'axios'
import OpenAI from 'openai'
import ShortUniqueId from 'short-unique-id'

import type { ImageAdapterSettings } from 'types/graphql'

import { db } from 'src/lib/db'

const openai = new OpenAI({
  apiKey: '',
  baseURL: `${process.env.LLM_API_URL}/v1`,
})

const itemIdGenerator = new ShortUniqueId({ length: 6 })
const itemCodeGenerator = new ShortUniqueId({ dictionary: 'number', length: 6 })

const generateBookingItem = async (bookingId: string) => {
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) {
    console.error('No booking found')
    return undefined
  }
  if (booking.userItemId) {
    console.error('Already has item')
    return undefined
  }

  try {
    const userItemId = await generateItem(booking.userId, booking.startDate)
    return await db.booking.update({
      where: { id: bookingId },
      data: {
        userItemId,
      },
    })
  } catch (e) {
    console.error(e)
    throw e
  }
}

const generateItemCharacter = async (image) => {
  const result = await openai.chat.completions.create({
    model: 'liuhaotian/llava-v1.6-vicuna-7b',
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'You are a creative AI writing assistant',
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: image,
            },
          },
          {
            type: 'text',
            text: 'Invent a unique and interesting character profile based on the image.',
          },
        ],
      },
    ],
  })
  return result.choices[0].message.content
}

const generateItem = async (userId, startDate) => {
  // Now get the dat we need to generate the image.
  // 1) The prompt given a template and a random fragment.
  // 2) The negative prompt (part of 1 sorta).
  // 3) The current adapter name.

  const adapters = await db.imageAdapterSetting.findMany({
    where: { startDate: { lt: startDate } },
    orderBy: [{ startDate: 'desc' }],
    take: 1,
  })
  if (!adapters || adapters.length === 0) {
    return undefined
  }

  const itemId = itemIdGenerator.rnd()
  const claimCode = itemCodeGenerator.rnd()
  const { image, request } = await generateImageFromAdapter(itemId, adapters[0])
  await db.stableItem.create({
    data: {
      id: itemId,
      image,
      claimCode,
      claimStatus: 'claimed',
      claimVisible: true,
      ownerId: userId,
      imageRequest: request,
    },
  })
  return itemId
}

const generateImageFromAdapter = async (
  itemId: string,
  adapterSettings: ImageAdapterSettings
) => {
  const request = {
    id: itemId,
    prompt: getPrompt(adapterSettings),
    negative_prompt: adapterSettings.negativePrompt,
    lora: adapterSettings.adapter,
    num_inference_steps: adapterSettings.steps,
  }
  const { data } = await axios.post(
    `${process.env.IMAGE_API_URL}/sdxl/generate`,
    request
  )
  const image = data.image
  return { image, request }
}

const getPrompt = (adapterSettings: ImageAdapterSettings) => {
  const index = Math.floor(Math.random() * adapterSettings.variants.length)
  const fragment = adapterSettings.variants[index]
  return `${fragment}, ${adapterSettings.promptTemplate}`
}

export {
  generateBookingItem,
  generateImageFromAdapter,
  generateItem,
  generateItemCharacter,
  openai,
}
