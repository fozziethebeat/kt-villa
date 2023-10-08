import type {
  FindStableItemQuery,
  FindStableItemQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

export const QUERY = gql`
  query FindStableItemQuery($id: String!) {
    stableItem: stableItem(id: $id) {
      id
      image
      text
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindStableItemQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  stableItem,
}: CellSuccessProps<FindStableItemQuery, FindStableItemQueryVariables>) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <figure>
        <img src={stableItem.image} />
      </figure>
      <div className="card-body">
        <p>{stableItem.text}</p>
        <h2 className="card-title">{stableItem.id}</h2>
      </div>
    </div>
  )
}
