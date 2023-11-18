import EditSignupCodeCell from 'src/components/Admin/SignupCode/EditSignupCodeCell'

type SignupCodePageProps = {
  id: string
}

const EditSignupCodePage = ({ id }: SignupCodePageProps) => {
  return <EditSignupCodeCell id={id} />
}

export default EditSignupCodePage
