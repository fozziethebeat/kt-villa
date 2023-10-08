import type { FindStableItems } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import StableItems from 'src/components/Admin/StableItem/StableItems'

export const QUERY = gql`
  query FindStableItems {
    stableItems {
      id
      image
      text
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      {'No stableItems yet. '}
      <Link to={routes.adminNewStableItem()} className="rw-link">
        {'Create one?'}
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({ stableItems }: CellSuccessProps<FindStableItems>) => {
  return <StableItems stableItems={stableItems} />
}
