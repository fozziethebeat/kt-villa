import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import BookingHero from 'src/components/BookingHero'
import StableItemsCell from 'src/components/StableItemsCell'

const HomePage = () => {
  return (
    <>
      <MetaTags title="Home" description="Home page" />
      <div className="flex flex-col gap-2">
        <BookingHero />
        <StableItemsCell />
      </div>
    </>
  )
}

export default HomePage
