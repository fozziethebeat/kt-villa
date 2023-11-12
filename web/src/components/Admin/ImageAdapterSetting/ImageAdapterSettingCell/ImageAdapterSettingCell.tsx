import type { FindImageAdapterSettingById } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import ImageAdapterSetting from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSetting'

export const QUERY = gql`
  query FindImageAdapterSettingById($id: Int!) {
    imageAdapterSetting: imageAdapterSetting(id: $id) {
      id
      startDate
      adapter
      promptTemplate
      negativePrompt
      steps
      variants
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>ImageAdapterSetting not found</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  imageAdapterSetting,
}: CellSuccessProps<FindImageAdapterSettingById>) => {
  return <ImageAdapterSetting imageAdapterSetting={imageAdapterSetting} />
}
