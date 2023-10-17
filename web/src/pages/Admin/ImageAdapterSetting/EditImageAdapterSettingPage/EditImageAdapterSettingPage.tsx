import EditImageAdapterSettingCell from 'src/components/Admin/ImageAdapterSetting/EditImageAdapterSettingCell'

type ImageAdapterSettingPageProps = {
  id: number
}

const EditImageAdapterSettingPage = ({ id }: ImageAdapterSettingPageProps) => {
  return <EditImageAdapterSettingCell id={id} />
}

export default EditImageAdapterSettingPage
