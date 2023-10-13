import ShortUniqueId from 'short-unique-id'

import { db } from 'src/lib/db'

const itemIdGenerator = new ShortUniqueId({ length: 6 })
const itemCodeGenerator = new ShortUniqueId({ dictionary: 'number', length: 6 })

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

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
  await sleep(1000)
  const itemIndex = Math.floor(Math.random() * 20)
  const formattedIndex = itemIndex.toString().padStart(5, '0')
  const image = `https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_${formattedIndex}_full.png`
  const text = 'random text goes here'
  const itemId = itemIdGenerator.rnd()
  const claimCode = itemCodeGenerator.rnd()

  await db.stableItem.create({
    data: {
      id: itemId,
      image,
      text,
      claimCode,
      claimStatus: 'claimed',
      claimVisible: true,
      ownerId: booking.userId,
    },
  })
  return await db.booking.update({
    where: { id: bookingId },
    data: {
      userItemId: itemId,
    },
  })
}

export { generateBookingItem }
