import { db } from 'api/src/lib/db'
import { genItemQueue } from 'api/src/lib/queues'

import ShortUniqueId from 'short-unique-id'

export default async ({ args }) => {
  const uid = new ShortUniqueId({ length: 6 })
  const codeid = new ShortUniqueId({ dictionary: 'number', length: 6 })
  genItemQueue.process(async (job, done) => {
    const bookingId = job.data.id
    const booking = await db.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      console.log('No booking found')
      done()
      return
    }
    if (booking.userItemId) {
      console.log('Already has item')
      done()
      return
    }
    const itemIndex = Math.floor(Math.random() * 20)
    const formattedIndex = itemIndex.toString().padStart(5, '0')
    const image = `https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_${formattedIndex}_full.png`
    const text = 'random text goes here'
    const itemId = uid.rnd()
    const claimCode = codeid.rnd()

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
    await db.booking.update({
      where: { id: bookingId },
      data: {
        userItemId: itemId,
      },
    })
    console.log('Item created')

    done()
  })
}
