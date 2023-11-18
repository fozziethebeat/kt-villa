import type { FindUserQuery, FindUserQueryVariables } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Link, routes } from '@redwoodjs/router'

export const QUERY = gql`
  query FindUserQuery($id: Int!) {
    user: user(id: $id) {
      id
      name
      email
      roles
      trustStatus
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindUserQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  user,
}: CellSuccessProps<FindUserQuery, FindUserQueryVariables>) => {
  return (
    <div>
      <table className="table">
        <tbody>
          <tr>
            <td>ID</td>
            <td>{user.id}</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>{user.name}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td>Roles</td>
            <td>{user.roles}</td>
          </tr>
          <tr>
            <td>Trust Status</td>
            <td>{user.trustStatus}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-row justify-center gap-2">
        <Link to={routes.editUser({ id: user.id })}>Edit</Link>
      </div>
    </div>
  )
}
