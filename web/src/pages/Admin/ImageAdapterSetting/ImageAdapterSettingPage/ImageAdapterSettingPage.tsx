import ImageAdapterSettingCell from 'src/components/Admin/ImageAdapterSetting/ImageAdapterSettingCell'

type ImageAdapterSettingPageProps = {
  id: number
}

const ImageAdapterSettingPage = ({ id }: ImageAdapterSettingPageProps) => {
  return <ImageAdapterSettingCell id={id} />
}

export default ImageAdapterSettingPage
