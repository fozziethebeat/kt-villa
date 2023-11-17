import type { UsersQuery } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'

export const QUERY = gql`
  query UsersQuery {
    users {
      id
      name
      email
      roles
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({ users }: CellSuccessProps<UsersQuery>) => {
  return (
    <table className="table">
      {/* head */}
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Email</th>
          <th>Roles</th>
          <th>Links</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={`mb-${user.id}`}>
            <th>{user.id}</th>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.roles}</td>
            <td>
              <div className="flex flex-row gap-2">
                <Link to={routes.user({ id: user.id })}>view</Link>
                <Link to={routes.editUser({ id: user.id })}>edit</Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
