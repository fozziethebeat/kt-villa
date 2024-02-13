import { Link, routes } from '@redwoodjs/router'
import { Metadata, MetaTags } from '@redwoodjs/web'

import StableItemCell from 'src/components/StableItemCell'

type ItemPageProps = {
  id: string
}

const ItemPage = ({ id }: ItemPageProps) => {
  return (
    <>
      <Metadata
        title="Stable Item"
        description="Item page for a KT Villa booking"
      >
        <meta httpEquiv="content-type" content="text/html; charset=UTF-8" />
      </Metadata>

      <StableItemCell id={id} />
    </>
  )
}

export default ItemPage
