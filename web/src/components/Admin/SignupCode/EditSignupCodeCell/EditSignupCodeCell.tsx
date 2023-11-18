import type { EditSignupCodeById, UpdateSignupCodeInput } from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import SignupCodeForm from 'src/components/Admin/SignupCode/SignupCodeForm'

export const QUERY = gql`
  query EditSignupCodeById($id: String!) {
    signupCode: signupCode(id: $id) {
      id
      trustStatus
    }
  }
`
const UPDATE_SIGNUP_CODE_MUTATION = gql`
  mutation UpdateSignupCodeMutation(
    $id: String!
    $input: UpdateSignupCodeInput!
  ) {
    updateSignupCode(id: $id, input: $input) {
      id
      trustStatus
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  signupCode,
}: CellSuccessProps<EditSignupCodeById>) => {
  const [updateSignupCode, { loading, error }] = useMutation(
    UPDATE_SIGNUP_CODE_MUTATION,
    {
      onCompleted: () => {
        toast.success('SignupCode updated')
        navigate(routes.adminSignupCodes())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (
    input: UpdateSignupCodeInput,
    id: EditSignupCodeById['signupCode']['id']
  ) => {
    updateSignupCode({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Edit SignupCode {signupCode?.id}
        </h2>
      </header>
      <div className="rw-segment-main">
        <SignupCodeForm
          signupCode={signupCode}
          onSave={onSave}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}
