import type { FindSignupCodes } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import SignupCodes from 'src/components/Admin/SignupCode/SignupCodes'

export const QUERY = gql`
  query FindSignupCodes {
    signupCodes {
      id
      trustStatus
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      {'No signupCodes yet. '}
      <Link to={routes.adminNewSignupCode()} className="rw-link">
        {'Create one?'}
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({ signupCodes }: CellSuccessProps<FindSignupCodes>) => {
  return <SignupCodes signupCodes={signupCodes} />
}
