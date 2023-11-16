import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import UsersCell from 'src/components/UsersCell'

const UsersPage = () => {
  return (
    <>
      <MetaTags title="Users" description="Users page" />

      <div className="p-4">
        <UsersCell />
      </div>
    </>
  )
}

export default UsersPage
