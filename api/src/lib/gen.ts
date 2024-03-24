import AWS from 'aws-sdk'
import axios from 'axios'
import OpenAI from 'openai'
import stream from 'stream'
import ShortUniqueId from 'short-unique-id'

import type { ImageAdapterSettings } from 'types/graphql'

import { db } from 'src/lib/db'

AWS.config.update({
  region: process.env.AWS_REGION,
})
const openai = new OpenAI()
const s3 = new AWS.S3()

const itemIdGenerator = new ShortUniqueId({ length: 6 })
const itemCodeGenerator = new ShortUniqueId({ dictionary: 'number', length: 6 })

const uploadImageToS3 = async (
  bucketName: string,
  imageUrl: string,
  targetKey: string
): string => {
  // Fetch the image using axios
  const response = await axios({
    method: 'get',
    url: imageUrl,
    responseType: 'stream',
  })

  const pass = new stream.PassThrough()

  // Stream the image directly to S3
  const params = {
    Bucket: bucketName,
    Key: targetKey,
    Body: pass,
    ContentType: response.headers['content-type'],
  }

  // Pipe the downloaded image to the S3 upload stream
  response.data.pipe(pass)

  // Upload the image to S3
  const uploadResult = await s3.upload(params).promise()
  return uploadResult.Location
}

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
  /*
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
  */
  const request = {
    text: 'You are a creative AI writing assistant.  USER: <image> The image is about a unique and interesting character.  Fill in the following JSON about the character\n',
    image_data: image,
    sampling_params: {
      skip_special_tokens: true,
      max_new_tokens: 256,
      temperature: 1.0,
      top_p: 1.0,
      top_k: -1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      ignore_eos: false,
      regex:
        '\\{\\n "name": "[\\w\\d\\s]{8,24}",\\n "hobbies": "[\\w\\d\\s,]{24,48}",\\n "background": "[\\w\\d\\s]{48,128}\\.",\\n "personality": "[\\w\\d\\s]{48,128}\\.",\\n "favorite_pun": "[\\w\\d\\s]{48,128}\\."\\n \\}',
    },
  }
  const { data } = await axios.post(
    `${process.env.LLM_API_URL}/generate`,
    request
  )
  return JSON.parse(data.text)
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
  try {
    // Get the image from OpenAI
    const request = {
      model: 'dall-e-3',
      prompt: getPrompt(adapterSettings),
      n: 1,
    }
    console.log(request)
    return {
      image: 'https://flowerfruits.mtn.surfacedata.org/results/kHeStv_full.png',
      request,
    }
    /*

    const response = await openai.images.generate(request)
    return { image: response.data[0].url, request }
    // Save the image to AWS S3
    const bucketName = process.env.AWS_BUCKET
    const imageUrl = response.data[0].url
    const targetKey = `results/${itemId}.png`
    const image = await uploadImageToS3(bucketName, imageUrl, targetKey)
    // Done
    return { image, request }
    */
  } catch (e) {
    console.error(e)
    throw e
  }
}
/*
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
*/

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
