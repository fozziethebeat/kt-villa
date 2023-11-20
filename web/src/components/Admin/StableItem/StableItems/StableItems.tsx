import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY } from 'src/components/Admin/StableItem/StableItemsCell'
import { truncate } from 'src/lib/formatters'

import type {
  DeleteStableItemMutationVariables,
  FindStableItems,
} from 'types/graphql'

const DELETE_STABLE_ITEM_MUTATION = gql`
  mutation DeleteStableItemMutation($id: String!) {
    deleteStableItem(id: $id) {
      id
    }
  }
`

const StableItemsList = ({ stableItems }: FindStableItems) => {
  const [deleteStableItem] = useMutation(DELETE_STABLE_ITEM_MUTATION, {
    onCompleted: () => {
      toast.success('StableItem deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    // This refetches the query on the list page. Read more about other ways to
    // update the cache over here:
    // https://www.apollographql.com/docs/react/data/mutations/#making-all-other-cache-updates
    refetchQueries: [{ query: QUERY }],
    awaitRefetchQueries: true,
  })

  const onDeleteClick = (id: DeleteStableItemMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete stableItem ' + id + '?')) {
      deleteStableItem({ variables: { id } })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Image</th>
            <th>Text</th>
            <th>Owner ID</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {stableItems.map((stableItem) => (
            <tr key={stableItem.id}>
              <td>{truncate(stableItem.id)}</td>
              <td>{truncate(stableItem.image)}</td>
              <td>{truncate(stableItem.text)}</td>
              <td>{truncate(stableItem.ownerId)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.adminStableItem({ id: stableItem.id })}
                    title={'Show stableItem ' + stableItem.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.adminEditStableItem({ id: stableItem.id })}
                    title={'Edit stableItem ' + stableItem.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={'Delete stableItem ' + stableItem.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(stableItem.id)}
                  >
                    Delete
                  </button>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default StableItemsList
