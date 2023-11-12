import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import ImageAdapterSettingForm from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSettingForm'

import type { CreateImageAdapterSettingInput } from 'types/graphql'

const CREATE_IMAGE_ADAPTER_SETTING_MUTATION = gql`
  mutation CreateImageAdapterSettingMutation(
    $input: CreateImageAdapterSettingInput!
  ) {
    createImageAdapterSetting(input: $input) {
      id
    }
  }
`

const NewImageAdapterSetting = () => {
  const [createImageAdapterSetting, { loading, error }] = useMutation(
    CREATE_IMAGE_ADAPTER_SETTING_MUTATION,
    {
      onCompleted: () => {
        toast.success('ImageAdapterSetting created')
        navigate(routes.adminImageAdapterSettings())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (input: CreateImageAdapterSettingInput) => {
    createImageAdapterSetting({
      variables: {
        input: {
          ...input,
          variants: input.variants.split(','),
        },
      },
    })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          New ImageAdapterSetting
        </h2>
      </header>
      <div className="rw-segment-main">
        <ImageAdapterSettingForm
          onSave={onSave}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}

export default NewImageAdapterSetting
