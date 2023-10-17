import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY } from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSettingsCell'
import { timeTag, truncate } from 'src/lib/formatters'

import type {
  DeleteImageAdapterSettingMutationVariables,
  FindImageAdapterSettings,
} from 'types/graphql'

const DELETE_IMAGE_ADAPTER_SETTING_MUTATION = gql`
  mutation DeleteImageAdapterSettingMutation($id: Int!) {
    deleteImageAdapterSetting(id: $id) {
      id
    }
  }
`

const ImageAdapterSettingsList = ({
  imageAdapterSettings,
}: FindImageAdapterSettings) => {
  const [deleteImageAdapterSetting] = useMutation(
    DELETE_IMAGE_ADAPTER_SETTING_MUTATION,
    {
      onCompleted: () => {
        toast.success('ImageAdapterSetting deleted')
      },
      onError: (error) => {
        toast.error(error.message)
      },
      // This refetches the query on the list page. Read more about other ways to
      // update the cache over here:
      // https://www.apollographql.com/docs/react/data/mutations/#making-all-other-cache-updates
      refetchQueries: [{ query: QUERY }],
      awaitRefetchQueries: true,
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
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Start date</th>
            <th>Adapter</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {imageAdapterSettings.map((imageAdapterSetting) => (
            <tr key={imageAdapterSetting.id}>
              <td>{truncate(imageAdapterSetting.id)}</td>
              <td>{timeTag(imageAdapterSetting.startDate)}</td>
              <td>{truncate(imageAdapterSetting.adapter)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.adminImageAdapterSetting({
                      id: imageAdapterSetting.id,
                    })}
                    title={
                      'Show imageAdapterSetting ' +
                      imageAdapterSetting.id +
                      ' detail'
                    }
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.adminEditImageAdapterSetting({
                      id: imageAdapterSetting.id,
                    })}
                    title={'Edit imageAdapterSetting ' + imageAdapterSetting.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={
                      'Delete imageAdapterSetting ' + imageAdapterSetting.id
                    }
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(imageAdapterSetting.id)}
                  >
                    Delete
                  </button>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ImageAdapterSettingsList
