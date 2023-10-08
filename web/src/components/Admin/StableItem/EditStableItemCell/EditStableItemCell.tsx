import type { EditStableItemById, UpdateStableItemInput } from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import StableItemForm from 'src/components/Admin/StableItem/StableItemForm'

export const QUERY = gql`
  query EditStableItemById($id: String!) {
    stableItem: stableItem(id: $id) {
      id
      image
      text
    }
  }
`
const UPDATE_STABLE_ITEM_MUTATION = gql`
  mutation UpdateStableItemMutation(
    $id: String!
    $input: UpdateStableItemInput!
  ) {
    updateStableItem(id: $id, input: $input) {
      id
      image
      text
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  stableItem,
}: CellSuccessProps<EditStableItemById>) => {
  const [updateStableItem, { loading, error }] = useMutation(
    UPDATE_STABLE_ITEM_MUTATION,
    {
      onCompleted: () => {
        toast.success('StableItem updated')
        navigate(routes.adminStableItems())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateStableItemInput,
    id: EditStableItemById['stableItem']['id']
  ) => {
    updateStableItem({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit StableItem {stableItem?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <StableItemForm
          stableItem={stableItem}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
