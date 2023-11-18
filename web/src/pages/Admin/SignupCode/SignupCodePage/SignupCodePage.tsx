import SignupCodeCell from 'src/components/Admin/SignupCode/SignupCodeCell'

type SignupCodePageProps = {
  id: string
}

const SignupCodePage = ({ id }: SignupCodePageProps) => {
  return <SignupCodeCell id={id} />
}

export default SignupCodePage
