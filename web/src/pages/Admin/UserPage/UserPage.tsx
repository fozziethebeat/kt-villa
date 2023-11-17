import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import UserCell from 'src/components/UserCell'

type UserPageProps = {
  id: number
}

const UserPage = ({ id }: UserPageProps) => {
  console.log(id)
  return (
    <>
      <MetaTags title="User" description="User page" />

      <UserCell id={id} />
    </>
  )
}

export default UserPage
