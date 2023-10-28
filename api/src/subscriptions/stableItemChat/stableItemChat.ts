import type { PubSub } from '@redwoodjs/realtime'
import type { StableItemChatMessage } from 'types/graphql'

import gql from 'graphql-tag'

export const schema = gql`
  type Subscription {
    stableItemMessage(id: String!): StableItemChatMessage! @requireAuth
  }
`

export type StableItemChatMessageChannel = {
  stableItemMessage: [id: string, payload: StableItemChatMessage]
}

export type StableItemChatMessageChannelType =
  PubSub<StableItemChatMessageChannel>

const stableItemMessage = {
  stableItemMessage: {
    subscribe: (
      _,
      { id }: { id: string },
      { pubSub }: { pubSub: StableItemChatMessageChannelType }
    ) => {
      if (id === '') {
        return
      }
      return pubSub.subscribe('stableItemMessage', id)
    },
    resolve: (payload) => {
      return payload
    },
  },
}

export default stableItemMessage
