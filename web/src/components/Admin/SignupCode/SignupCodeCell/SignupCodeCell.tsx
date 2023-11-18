import type { FindSignupCodeById } from 'types/graphql'

import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import SignupCode from 'src/components/Admin/SignupCode/SignupCode'

export const QUERY = gql`
  query FindSignupCodeById($id: String!) {
    signupCode: signupCode(id: $id) {
      id
      trustStatus
      roles
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>SignupCode not found</div>

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  signupCode,
}: CellSuccessProps<FindSignupCodeById>) => {
  return <SignupCode signupCode={signupCode} />
}
