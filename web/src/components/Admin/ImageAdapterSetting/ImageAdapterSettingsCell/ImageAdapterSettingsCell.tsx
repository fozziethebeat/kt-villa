import type { FindImageAdapterSettings } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import ImageAdapterSettings from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSettings'

export const QUERY = gql`
  query FindImageAdapterSettings {
    imageAdapterSettings {
      id
      startDate
      adapter
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      {'No imageAdapterSettings yet. '}
      <Link to={routes.adminNewImageAdapterSetting()} className="rw-link">
        {'Create one?'}
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  imageAdapterSettings,
}: CellSuccessProps<FindImageAdapterSettings>) => {
  return <ImageAdapterSettings imageAdapterSettings={imageAdapterSettings} />
}
