import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import {} from 'src/lib/formatters'

import type {
  DeleteStableItemMutationVariables,
  FindStableItemById,
} from 'types/graphql'

const DELETE_STABLE_ITEM_MUTATION = gql`
  mutation DeleteStableItemMutation($id: String!) {
    deleteStableItem(id: $id) {
      id
    }
  }
`

interface Props {
  stableItem: NonNullable<FindStableItemById['stableItem']>
}

const StableItem = ({ stableItem }: Props) => {
  const [deleteStableItem] = useMutation(DELETE_STABLE_ITEM_MUTATION, {
    onCompleted: () => {
      toast.success('StableItem deleted')
      navigate(routes.adminStableItems())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onDeleteClick = (id: DeleteStableItemMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete stableItem ' + id + '?')) {
      deleteStableItem({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            StableItem {stableItem.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{stableItem.id}</td>
            </tr>
            <tr>
              <th>Image</th>
              <td>{stableItem.image}</td>
            </tr>
            <tr>
              <th>Text</th>
              <td>{stableItem.text}</td>
            </tr>
            <tr>
              <th>Owner ID</th>
              <td>{stableItem.ownerId}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <Link
          to={routes.adminEditStableItem({ id: stableItem.id })}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <button
          type="button"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(stableItem.id)}
        >
          Delete
        </button>
      </nav>
    </>
  )
}

export default StableItem
