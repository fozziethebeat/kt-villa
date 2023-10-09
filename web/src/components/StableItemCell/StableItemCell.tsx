import type {
  FindStableItemQuery,
  FindStableItemQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import ClaimForm from 'src/components/ClaimForm'

export const QUERY = gql`
  query FindStableItemQuery($id: String!) {
    stableItem: stableItem(id: $id) {
      id
      image
      text
      claimStatus
      claimVisible
      ownerUsername
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
    <div className="flex flex-row gap-8 ">
      <figure className="h-96 w-96">
        <img src={stableItem.image} />
      </figure>
      <div className="flex flex-col ">
        <div>
          <div className="badge badge-neutral">{stableItem.claimStatus}</div>
          <div className="badge badge-primary">{stableItem.ownerUsername}</div>
        </div>
        <h2 className="">{stableItem.id}</h2>
        <p>{stableItem.text}</p>
        {stableItem.claimStatus === 'unclaimed' && (
          <ClaimForm item={stableItem} />
        )}
      </div>
    </div>
  )
}
