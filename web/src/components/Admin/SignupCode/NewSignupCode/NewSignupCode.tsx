import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import SignupCodeForm from 'src/components/Admin/SignupCode/SignupCodeForm'

import type { CreateSignupCodeInput } from 'types/graphql'

const CREATE_SIGNUP_CODE_MUTATION = gql`
  mutation CreateSignupCodeMutation($input: CreateSignupCodeInput!) {
    createSignupCode(input: $input) {
      id
    }
  }
`

const NewSignupCode = () => {
  const [createSignupCode, { loading, error }] = useMutation(
    CREATE_SIGNUP_CODE_MUTATION,
    {
      onCompleted: () => {
        toast.success('SignupCode created')
        navigate(routes.adminSignupCodes())
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  const onSave = (input: CreateSignupCodeInput) => {
    createSignupCode({ variables: { input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">New SignupCode</h2>
      </header>
      <div className="rw-segment-main">
        <SignupCodeForm onSave={onSave} loading={loading} error={error} />
      </div>
    </div>
  )
}

export default NewSignupCode
