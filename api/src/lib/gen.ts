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

const CHARACTER_INSTRUCTION = 'Write a chatbot character profile for this image'

const PROMPT_STARTS = ['a city made of floating airships']

const PROMPT = `cyberpunk solarpunk by moebius, masterpiece, best quality, intricate, highly detailed:1.1, drawing, Jean Giraud`
const NEGATIVE_PROMPT =
  '(unnatural hands:1.5), extra fingers, fewer digits, (mutated hands and fingers:1.5), blurry, (dark, shadows, darkness), (deformed face:1.4), (ugly), lowres, ((bad anatomy )), anime, manga, (poorly drawn face), ((mutation)), ((bad proportions)), ((extra limbs)), cropped, ((jpeg artifacts)), out of frame, duplicated artefact, cropped image, deformed, signatures, cut-off, over- saturated, grain, poorly drawn face, out of focus, mutilated, mangled, morbid, gross proportions, watermark, heterochromia, canvas frame, ((disfigured)), ((bad art))'

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
  const request = {
    image,
    instruction: CHARACTER_INSTRUCTION,
  }
  const { data } = await axios.post(
    `${process.env.IMAGE_API_URL}/sdxl/generate-profile`,
    request
  )
  return data.profile
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
  return `${fragment}, ${adapterSettings.prompt}`
}

export {
  generateBookingItem,
  generateImageFromAdapter,
  generateItem,
  generateItemCharacter,
  openai,
}
