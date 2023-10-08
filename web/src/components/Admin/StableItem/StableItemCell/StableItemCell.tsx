import type { FindStableItemById } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import StableItem from 'src/components/Admin/StableItem/StableItem'

export const QUERY = gql`
  query FindStableItemById($id: String!) {
    stableItem: stableItem(id: $id) {
      id
      image
      text
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>StableItem not found</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  stableItem,
}: CellSuccessProps<FindStableItemById>) => {
  return <StableItem stableItem={stableItem} />
}
