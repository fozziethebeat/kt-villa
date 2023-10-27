import { RedwoodRealtimeOptions } from '@redwoodjs/realtime'

import subscriptions from 'src/subscriptions/**/*'
console.log(subscriptions)

export const realtime: RedwoodRealtimeOptions = {
  subscriptions: {
    subscriptions,
    store: 'in-memory',
  },
}
