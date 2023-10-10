import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import UserBookingsCell from 'src/components/UserBookingsCell'

const MyPage = () => {
  return (
    <>
      <MetaTags title="My" description="My page" />

      <div className="flex flex-col gap-2">
        <UserBookingsCell />
      </div>
    </>
  )
}

export default MyPage
