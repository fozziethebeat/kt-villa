import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { timeTag } from 'src/lib/formatters'

import type {
  DeleteImageAdapterSettingMutationVariables,
  FindImageAdapterSettingById,
} from 'types/graphql'

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
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
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
    </>
  )
}

export default ImageAdapterSetting
