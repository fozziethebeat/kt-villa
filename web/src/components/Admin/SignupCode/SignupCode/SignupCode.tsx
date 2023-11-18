import { Link, routes, navigate } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import {} from 'src/lib/formatters'

import type {
  DeleteSignupCodeMutationVariables,
  FindSignupCodeById,
} from 'types/graphql'

const DELETE_SIGNUP_CODE_MUTATION = gql`
  mutation DeleteSignupCodeMutation($id: String!) {
    deleteSignupCode(id: $id) {
      id
    }
  }
`

interface Props {
  signupCode: NonNullable<FindSignupCodeById['signupCode']>
}

const SignupCode = ({ signupCode }: Props) => {
  const [deleteSignupCode] = useMutation(DELETE_SIGNUP_CODE_MUTATION, {
    onCompleted: () => {
      toast.success('SignupCode deleted')
      navigate(routes.adminSignupCodes())
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onDeleteClick = (id: DeleteSignupCodeMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete signupCode ' + id + '?')) {
      deleteSignupCode({ variables: { id } })
    }
  }

  return (
    <>
      <div className="rw-segment">
        <header className="rw-segment-header">
          <h2 className="rw-heading rw-heading-secondary">
            SignupCode {signupCode.id} Detail
          </h2>
        </header>
        <table className="rw-table">
          <tbody>
            <tr>
              <th>Id</th>
              <td>{signupCode.id}</td>
            </tr>
            <tr>
              <th>Trust status</th>
              <td>{signupCode.trustStatus}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav className="rw-button-group">
        <Link
          to={routes.adminEditSignupCode({ id: signupCode.id })}
          className="rw-button rw-button-blue"
        >
          Edit
        </Link>
        <button
          type="button"
          className="rw-button rw-button-red"
          onClick={() => onDeleteClick(signupCode.id)}
        >
          Delete
        </button>
      </nav>
    </>
  )
}

export default SignupCode
