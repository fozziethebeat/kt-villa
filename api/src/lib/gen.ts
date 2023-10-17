import axios from 'axios'
import ShortUniqueId from 'short-unique-id'

import { db } from 'src/lib/db'

const itemIdGenerator = new ShortUniqueId({ length: 6 })
const itemCodeGenerator = new ShortUniqueId({ dictionary: 'number', length: 6 })

const PROMPT_STARTS = ['a city made of floating airships']

const NEGATIVE_PROMPT =
  '(unnatural hands:1.5), extra fingers, fewer digits, (mutated hands and fingers:1.5), blurry, (dark, shadows, darkness), (deformed face:1.4), (ugly), lowres, ((bad anatomy )), anime, manga, (poorly drawn face), ((mutation)), ((bad proportions)), ((extra limbs)), cropped, ((jpeg artifacts)), out of frame, duplicated artefact, cropped image, deformed, signatures, cut-off, over- saturated, grain, poorly drawn face, out of focus, mutilated, mangled, morbid, gross proportions, watermark, heterochromia, canvas frame, ((disfigured)), ((bad art))'

const generateBookingItem = async (bookingId: string) => {
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) {
    console.log('No booking found')
    return undefined
  }
  if (booking.userItemId) {
    console.log('Already has item')
    return undefined
  }

  // Now get the dat we need to generate the image.
  // 1) The prompt given a template and a random fragment.
  // 2) The negative prompt (part of 1 sorta).
  // 3) The current adapter name.

  const adapters = await db.imageAdapterSetting.findMany({
    orderBy: [{ startDate: 'desc' }],
    take: 1,
  })
  if (!adapters || adapters.length === 0) {
    return undefined
  }

  const itemId = itemIdGenerator.rnd()
  const claimCode = itemCodeGenerator.rnd()
  const request = {
    id: itemId,
    prompt: getPrompt(),
    negative_prompt: NEGATIVE_PROMPT,
    lora: adapters[0].adapter,
  }
  const { data } = await axios.post(
    `${process.env.IMAGE_API_URL}/sdxl/generate`,
    request
  )

  const image = data.image
  const text = 'random text goes here'

  await db.stableItem.create({
    data: {
      id: itemId,
      image,
      text,
      claimCode,
      claimStatus: 'claimed',
      claimVisible: true,
      ownerId: booking.userId,
      imageRequest: request,
    },
  })
  return await db.booking.update({
    where: { id: bookingId },
    data: {
      userItemId: itemId,
    },
  })
}

const getPrompt = () => {
  const index = Math.floor(Math.random() * PROMPT_STARTS.length)
  const fragment = PROMPT_STARTS[index]
  return `${fragment}, cyberpunk solarpunk by moebius, masterpiece, best quality, intricate, highly detailed:1.1, drawing, Jean Giraud`
}

export { generateBookingItem }
