import StableItemCell from 'src/components/Admin/StableItem/StableItemCell'

type StableItemPageProps = {
  id: string
}

const StableItemPage = ({ id }: StableItemPageProps) => {
  return <StableItemCell id={id} />
}

export default StableItemPage
