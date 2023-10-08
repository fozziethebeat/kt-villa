import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import StableItemForm from 'src/components/Admin/StableItem/StableItemForm'

import type { CreateStableItemInput } from 'types/graphql'

const CREATE_STABLE_ITEM_MUTATION = gql`
  mutation CreateStableItemMutation($input: CreateStableItemInput!) {
    createStableItem(input: $input) {
      id
    }
  }
`

const NewStableItem = () => {
  const [createStableItem, { loading, error }] = useMutation(
    CREATE_STABLE_ITEM_MUTATION,
    {
      onCompleted: () => {
        toast.success('StableItem created')
        navigate(routes.adminStableItems())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (input: CreateStableItemInput) => {
    createStableItem({ variables: { input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">New StableItem</h2>
      </header>
      <div className="rw-segment-main">
        <StableItemForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewStableItem
