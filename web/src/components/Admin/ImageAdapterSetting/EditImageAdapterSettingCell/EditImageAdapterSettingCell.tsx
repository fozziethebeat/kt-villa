import type {
  EditImageAdapterSettingById,
  UpdateImageAdapterSettingInput,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import ImageAdapterSettingForm from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSettingForm'

export const QUERY = gql`
  query EditImageAdapterSettingById($id: Int!) {
    imageAdapterSetting: imageAdapterSetting(id: $id) {
      id
      startDate
      adapter
    }
  }
`
const UPDATE_IMAGE_ADAPTER_SETTING_MUTATION = gql`
  mutation UpdateImageAdapterSettingMutation(
    $id: Int!
    $input: UpdateImageAdapterSettingInput!
  ) {
    updateImageAdapterSetting(id: $id, input: $input) {
      id
      startDate
      adapter
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  imageAdapterSetting,
}: CellSuccessProps<EditImageAdapterSettingById>) => {
  const [updateImageAdapterSetting, { loading, error }] = useMutation(
    UPDATE_IMAGE_ADAPTER_SETTING_MUTATION,
    {
      onCompleted: () => {
        toast.success('ImageAdapterSetting updated')
        navigate(routes.adminImageAdapterSettings())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateImageAdapterSettingInput,
    id: EditImageAdapterSettingById['imageAdapterSetting']['id']
  ) => {
    updateImageAdapterSetting({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit ImageAdapterSetting {imageAdapterSetting?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <ImageAdapterSettingForm
          imageAdapterSetting={imageAdapterSetting}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
