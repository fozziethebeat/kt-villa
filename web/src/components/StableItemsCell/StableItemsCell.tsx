import type { StableItemsQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import StableItemCard from 'src/components/StableItemCard'

export const QUERY = gql`
  query StableItemsQuery {
    stableItems {
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

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  stableItems,
}: CellSuccessProps<StableItemsQuery>) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {stableItems.map((item) => (
        <StableItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
