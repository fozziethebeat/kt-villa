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
        title="KT Villa booking item"
        description="KT Villa booking item"
      >
        <meta httpEquiv="content-type" content="text/html; charset=UTF-8" />
      </Metadata>

      <StableItemCell id={id} />
    </>
  )
}

export default ItemPage
