import EditStableItemCell from 'src/components/Admin/StableItem/EditStableItemCell'

type StableItemPageProps = {
  id: string
}

const EditStableItemPage = ({ id }: StableItemPageProps) => {
  return <EditStableItemCell id={id} />
}

export default EditStableItemPage
