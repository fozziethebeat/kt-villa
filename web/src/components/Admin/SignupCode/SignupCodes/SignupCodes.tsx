import { Link, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY } from 'src/components/Admin/SignupCode/SignupCodesCell'
import { truncate } from 'src/lib/formatters'

import type {
  DeleteSignupCodeMutationVariables,
  FindSignupCodes,
} from 'types/graphql'

const DELETE_SIGNUP_CODE_MUTATION = gql`
  mutation DeleteSignupCodeMutation($id: String!) {
    deleteSignupCode(id: $id) {
      id
    }
  }
`

const SignupCodesList = ({ signupCodes }: FindSignupCodes) => {
  const [deleteSignupCode] = useMutation(DELETE_SIGNUP_CODE_MUTATION, {
    onCompleted: () => {
      toast.success('SignupCode deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    // This refetches the query on the list page. Read more about other ways to
    // update the cache over here:
    // https://www.apollographql.com/docs/react/data/mutations/#making-all-other-cache-updates
    refetchQueries: [{ query: QUERY }],
    awaitRefetchQueries: true,
  })

  const onDeleteClick = (id: DeleteSignupCodeMutationVariables['id']) => {
    if (confirm('Are you sure you want to delete signupCode ' + id + '?')) {
      deleteSignupCode({ variables: { id } })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Trust status</th>
            <th>Roles</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {signupCodes.map((signupCode) => (
            <tr key={signupCode.id}>
              <td>{truncate(signupCode.id)}</td>
              <td>{truncate(signupCode.trustStatus)}</td>
              <td>{truncate(signupCode.roles)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.adminSignupCode({ id: signupCode.id })}
                    title={'Show signupCode ' + signupCode.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Show
                  </Link>
                  <Link
                    to={routes.adminEditSignupCode({ id: signupCode.id })}
                    title={'Edit signupCode ' + signupCode.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title={'Delete signupCode ' + signupCode.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(signupCode.id)}
                  >
                    Delete
                  </button>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SignupCodesList
