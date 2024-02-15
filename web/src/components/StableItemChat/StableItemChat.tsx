import { Form, Submit, TextField } from '@redwoodjs/forms'
import { useMutation, useSubscription } from '@redwoodjs/web'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { v4 as uuid } from 'uuid'

enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

interface Message {
  id: string
  role: MessageRole
  text: string
}

const MUTATION = gql`
  mutation StableItemChatBasic($input: StableItemChatInput!) {
    stableItemChatBasic(input: $input) {
      id
      role
      text
    }
  }
`

const SUBSCRIPTION = gql`
  subscription StableItemMessage($id: String!) {
    stableItemMessage(id: $id) {
      id
      role
      text
    }
  }
`
const StableItemChat = ({ stableItem }) => {
  const formMethods = useForm()
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const [messageId, setMessageId] = useState<string>('')
  const [stableItemChatBasic, { loading, error }] = useMutation(MUTATION, {
    onCompleted: (data) => {
      /*
      const newMessage = {
        id: data.stableItemChatBasic.id,
        text: data.stableItemChatBasic.text,
        role: data.stableItemChatBasic.role,
      }
      setMessageHistory((oldHistory) => [...oldHistory, newMessage])
       */
    },
  })

  useSubscription(SUBSCRIPTION, {
    variables: { id: stableItem?.id || '' },
    onData: ({ data }) => {
      const message = {
        id: data.data.stableItemMessage.id,
        text: data.data.stableItemMessage.text,
        role: data.data.stableItemMessage.role,
      }
      setMessageHistory((oldHistory) => {
        if (oldHistory[oldHistory.length - 1].role === MessageRole.ASSISTANT) {
          oldHistory.pop()
        }
        return [...oldHistory, message]
      })
    },
  })

  const onSend = (input) => {
    const newMessage = {
      id: uuid(),
      text: input.text,
      role: MessageRole.USER,
    }
    setMessageHistory((oldHistory) => [...oldHistory, newMessage])
    formMethods.reset()
    stableItemChatBasic({
      variables: {
        input: {
          id: stableItem.id,
          messages: messageHistory.map(({ role, text }) => ({ role, text })),
        },
      },
    })
  }

  if (stableItem.ownerUsername !== 'you') {
    return <></>
  }

  if (!stableItem.character) {
    return <></>
  }
  return (
    <div className="p-2">
      {messageHistory.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
      <Form
        formMethods={formMethods}
        onSubmit={onSend}
        className="mt-2 flex flex-row gap-2"
      >
        <TextField
          name="text"
          autoComplete="off"
          placeholder="Type here"
          className="input input-bordered w-full"
          validation={{ required: true }}
        />

        <Submit disabled={loading} className="btn btn-primary">
          Send
        </Submit>
      </Form>
    </div>
  )
}

const ChatMessage = ({ message }) => {
  if (message.role === MessageRole.USER) {
    return <ChatMessageUser message={message} />
  }
  if (message.role === MessageRole.ASSISTANT) {
    return <ChatMessageAssistant message={message} />
  }
  return <></>
}

const ChatMessageAssistant = ({ message }) => {
  return (
    <div className="chat chat-start">
      <div className="avatar placeholder">
        <div className="bg-neutral-focus w-8 rounded-full text-neutral-content">
          <span className="text-xs">bot</span>
        </div>
      </div>
      <div className="chat-bubble">{message.text}</div>
    </div>
  )
}

const ChatMessageUser = ({ message }) => {
  return (
    <div className="chat chat-end">
      <div className="chat-bubble">{message.text}</div>
      <div className="avatar placeholder">
        <div className="bg-neutral-focus w-8 rounded-full text-neutral-content">
          <span className="text-xs">you</span>
        </div>
      </div>
    </div>
  )
}

export default StableItemChat
