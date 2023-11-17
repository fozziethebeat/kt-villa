import type { UserQuery, UserQueryVariables } from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import UserForm from 'src/components/UserForm'

export const QUERY = gql`
  query FindEditUserQuery($id: Int!) {
    user(id: $id) {
      id
      name
      email
      roles
    }
  }
`

const MUTATION = gql`
  mutation UpdateUserMutation($id: Int!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }: CellFailureProps<UserQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  user,
}: CellSuccessProps<UserQuery, UserQueryVariables>) => {
  const [updateUser, { loading, error }] = useMutation(MUTATION, {
    onCompleted: () => {
      toast.success('User updated')
      navigate(routes.adminUsers())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const onSave = (input: UpdateUserInput, id: number) => {
    updateUser({ variables: { id, input } })
  }

  return (
    <UserForm user={user} onSave={onSave} error={error} loading={loading} />
  )
}
