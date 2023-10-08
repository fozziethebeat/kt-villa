import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import StableItemsCell from 'src/components/StableItemsCell'

const HomePage = () => {
  return (
    <>
      <MetaTags title="Home" description="Home page" />
      <StableItemsCell />
    </>
  )
}

export default HomePage
