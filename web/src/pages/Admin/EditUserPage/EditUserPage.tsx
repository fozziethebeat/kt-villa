import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import EditUserCell from 'src/components/EditUserCell'
type EditUserPageProps = {
  id: int
}

const EditUserPage = ({ id }: EditUserPageProps) => {
  return (
    <>
      <MetaTags title="EditUser" description="EditUser page" />

      <EditUserCell id={id} />
    </>
  )
}

export default EditUserPage
