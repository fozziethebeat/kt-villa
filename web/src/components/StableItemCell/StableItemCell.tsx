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
    <div className="min-h-screen w-full bg-neutral-200">
      <div className="hero-content flex-col items-start lg:flex-row">
        <figure className="h-96 w-96">
          <img src={stableItem.image} />
        </figure>
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold">Item Code: {stableItem.id}</h2>
          <div className="flex justify-between gap-2">
            <div>Owner</div>
            <div className="badge badge-neutral badge-lg">
              {stableItem.ownerUsername}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>Claimed</div>
            <div className="badge badge-primary badge-lg">
              {stableItem.claimStatus}
            </div>
          </div>
        </div>
      </div>
      <div>
        {stableItem.claimStatus === 'unclaimed' && (
          <ClaimForm item={stableItem} />
        )}
      </div>
    </div>
  )
}
