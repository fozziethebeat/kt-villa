import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import StableItemCell from 'src/components/StableItemCell'

type ItemPageProps = {
  id: string
}

const ItemPage = ({ id }: ItemPageProps) => {
  return (
    <>
      <MetaTags title="Item" description="Item page" />
      <StableItemCell id={id} />
    </>
  )
}

export default ItemPage
