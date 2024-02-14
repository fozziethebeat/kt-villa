import type {
  QueryResolvers,
  MutationResolvers,
  StableItemRelationResolvers,
} from 'types/graphql'
import type { StableItemChatMessageChannelType } from 'src/subscriptions/stableItemChat'

import { validateWith } from '@redwoodjs/api'
import { RedwoodGraphQLContext } from '@redwoodjs/graphql-server/dist/types'
import ShortUniqueId from 'short-unique-id'
import { v4 as uuid } from 'uuid'

import { db } from 'src/lib/db'
import { generateItemCharacter, openai } from 'src/lib/gen'

enum ClaimStatus {
  CLAIMED = 'claimed',
  UNCLAIMED = 'unclaimed',
}

const uid = new ShortUniqueId({ length: 10 })

export const stableItems: QueryResolvers['stableItems'] = () => {
  return db.stableItem.findMany()
}

export const stableItem: QueryResolvers['stableItem'] = ({ id }) => {
  return db.stableItem.findUnique({
    where: { id },
  })
}

export const claimItem: MutationResolvers['claimItem'] = async ({ input }) => {
  const { id, code } = input
  await validateWith(async () => {
    const item = await db.stableItem.findUnique({
      where: { id },
      select: {
        claimCode: true,
        claimStatus: true,
        owner: true,
      },
    })
    if (!item) {
      throw 'No item found'
    }
    if (item.claimStatus !== ClaimStatus.UNCLAIMED) {
      throw 'Item already claimed'
    }
    if (item.claimCode !== code) {
      throw 'Invalid claim code'
    }
  })
  return db.stableItem.update({
    data: {
      claimStatus: ClaimStatus.CLAIMED,
      ownerId: context.currentUser.id,
    },
    where: { id },
  })
}

export const createItemCharacter: MutationResolvers['createItemCharacter'] =
  async ({ id }) => {
    const stableItem = await db.stableItem.findUnique({ where: { id } })
    if (!stableItem) {
      throw new Error('Item does not exist')
    }
    if (stableItem.ownerId !== context.currentUser.id) {
      throw new Error('Not Authorized')
    }
    const character = await generateItemCharacter(stableItem.image)
    return db.stableItem.update({ where: { id }, data: { character } })
  }

interface ChatContext extends RedwoodGraphQLContext {
  pubSub: StableItemChatMessageChannelType
}

export const stableItemChatBasic: MutationResolvers['stableItemChatBasic'] =
  async ({ input }, { context }: { context: ChatContext }) => {
    const stableItem = await db.stableItem.findUnique({
      where: { id: input.id },
    })
    if (!stableItem || !stableItem.text) {
      throw new Error('Not ready for chatting')
    }
    if (stableItem.ownerId !== context.currentUser.id) {
      throw new Error('Not authorized for chatting')
    }
    const profile = stableItem.text
    const messages = [
      {
        role: 'system',
        content: `You are a friendly chatbot who always responds in a style following this character profile: ${profile}`,
      },
      ...input.messages.map(({ role, text }) => ({
        role,
        content: text,
      })),
    ]
    const stream = await openai.chat.completions.create({
      model: 'liuhaotian/llava-v1.6-vicuna-7b',
      messages,
      stream: true,
    })
    const response = {
      id: uuid(),
      role: 'assistant',
      text: '',
    }
    for await (const chunk of stream) {
      const { content } = chunk.choices[0].delta
      response.text += content ?? ''
      context.pubSub.publish('stableItemMessage', input.id, response)
    }
    return response
  }

export const createStableItem: MutationResolvers['createStableItem'] = ({
  input,
}) => {
  return db.stableItem.create({
    data: {
      ...input,
      id: uid.rnd(),
    },
  })
}

export const updateStableItem: MutationResolvers['updateStableItem'] = ({
  id,
  input,
}) => {
  return db.stableItem.update({
    data: input,
    where: { id },
  })
}

export const deleteStableItem: MutationResolvers['deleteStableItem'] = ({
  id,
}) => {
  return db.stableItem.delete({
    where: { id },
  })
}

export const StableItem: StableItemRelationResolvers = {
  ownerUsername: async (args, { root }) => {
    const item = root
    if (!context.currentUser) {
      return 'anon'
    }
    if (!item.ownerId) {
      return 'unknown'
    }
    if (item.claimStatus !== ClaimStatus.CLAIMED) {
      return 'none'
    }
    if (item.ownerId === context.currentUser.id) {
      return 'you'
    }
    if (!item.claimVisible) {
      return 'anon'
    }
    const owner = await db.user.findUnique({
      where: { id: item.ownerId },
      select: { name: true },
    })
    return owner.name
  },
}
