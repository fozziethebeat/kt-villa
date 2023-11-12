import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'
import { useState } from 'react'

import { timeTag } from 'src/lib/formatters'

import type {
  DeleteImageAdapterSettingMutationVariables,
  FindImageAdapterSettingById,
} from 'types/graphql'

const TEST_IMAGE_ADAPTER_SETTING_MUTATION = gql`
  mutation TestImageAdapter($id: Int!) {
    testImageAdapter(id: $id) {
      image
    }
  }
`

const DELETE_IMAGE_ADAPTER_SETTING_MUTATION = gql`
  mutation DeleteImageAdapterSettingMutation($id: Int!) {
    deleteImageAdapterSetting(id: $id) {
      id
    }
  }
`

interface Props {
  imageAdapterSetting: NonNullable<
    FindImageAdapterSettingById['imageAdapterSetting']
  >
}

const ImageAdapterSetting = ({ imageAdapterSetting }: Props) => {
  const [requestId, setRequestId] = useState(new Date())
  const [deleteImageAdapterSetting] = useMutation(
    DELETE_IMAGE_ADAPTER_SETTING_MUTATION,
    {
      onCompleted: () => {
        toast.success('ImageAdapterSetting deleted')
        navigate(routes.adminImageAdapterSettings())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const [testImageAdapter, { data: testImageData, loading: testImageLoading }] =
    useMutation(TEST_IMAGE_ADAPTER_SETTING_MUTATION)
  const onTestClick = () => {
    setRequestId(new Date())
    testImageAdapter({ variables: { id: imageAdapterSetting.id } })
  }

  const onDeleteClick = (
    id: DeleteImageAdapterSettingMutationVariables['id']
  ) => {
    if (
      confirm('Are you sure you want to delete imageAdapterSetting ' + id + '?')
    ) {
      deleteImageAdapterSetting({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            ImageAdapterSetting {imageAdapterSetting.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{imageAdapterSetting.id}</td>
            </tr>
            <tr>
              <th>Start date</th>
              <td>{timeTag(imageAdapterSetting.startDate)}</td>
            </tr>
            <tr>
              <th>Adapter</th>
              <td>{imageAdapterSetting.adapter}</td>
            </tr>
            <tr>
              <th>Prompt Template</th>
              <td>{imageAdapterSetting.promptTemplate}</td>
            </tr>
            <tr>
              <th>Prompt Template</th>
              <td>{imageAdapterSetting.promptTemplate}</td>
            </tr>
            <tr>
              <th>Negative Prompt</th>
              <td>{imageAdapterSetting.negativePrompt}</td>
            </tr>
            <tr>
              <th>Steps</th>
              <td>{imageAdapterSetting.steps}</td>
            </tr>
            <tr>
              <th>Variants</th>
              <td>{imageAdapterSetting.variants.join(',')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <button
          type="button"
          className="rw-button rw-button-green"
          onClick={onTestClick}
        >
          Test
        </button>

        <Link
          to={routes.adminEditImageAdapterSetting({
            id: imageAdapterSetting.id,
          })}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <button
          type="button"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(imageAdapterSetting.id)}
        >
          Delete
        </button>
      </nav>
      {testImageLoading && (
        <progress className="progress progress-success w-56" />
      )}
      {testImageData && (
        <figure className="flex justify-center">
          <img src={`${testImageData.testImageAdapter.image}?${requestId}`} />
        </figure>
      )}
    </>
  )
}

export default ImageAdapterSetting
