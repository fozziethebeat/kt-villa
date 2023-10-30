import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import MemberBookingsCell from 'src/components/MemberBookingsCell'
import UserBookingsCell from 'src/components/UserBookingsCell'

const MyPage = () => {
  return (
    <>
      <MetaTags title="My" description="My page" />

      <div className="mx-4 flex flex-col gap-2">
        <MemberBookingsCell />
        <UserBookingsCell />
      </div>
    </>
  )
}

export default MyPage
