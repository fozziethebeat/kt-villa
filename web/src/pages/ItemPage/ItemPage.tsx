import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import StableItemCell from 'src/components/StableItemCell'

type ItemPageProps = {
  id: string
}

const ItemPage = ({ id }: ItemPageProps) => {
  return (
    <>
      <MetaTags
        title="Stable Item"
        description="Item page for a KT Villa booking"
        robots="noindex,nofollow"
        og={{
          image: '',
        }}
        twitter={{
          card: 'summary',
          site: '@ktvilla',
          creator: '@fozziethebeat',
        }}
      >
        <meta httpEquiv="content-type" content="text/html; charset=UTF-8" />
      </MetaTags>

      <StableItemCell id={id} />
    </>
  )
}

export default ItemPage
