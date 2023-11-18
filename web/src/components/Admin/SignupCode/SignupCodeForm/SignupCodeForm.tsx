import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/forms'

import type { EditSignupCodeById, UpdateSignupCodeInput } from 'types/graphql'
import type { RWGqlError } from '@redwoodjs/forms'

type FormSignupCode = NonNullable<EditSignupCodeById['signupCode']>

interface SignupCodeFormProps {
  signupCode?: EditSignupCodeById['signupCode']
  onSave: (data: UpdateSignupCodeInput, id?: FormSignupCode['id']) => void
  error: RWGqlError
  loading: boolean
}

const SignupCodeForm = (props: SignupCodeFormProps) => {
  const onSubmit = (data: FormSignupCode) => {
    props.onSave(data, props?.signupCode?.id)
  }

  return (
    <div className="rw-form-wrapper">
      <Form<FormSignupCode> onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />
        <Label
          name="id"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          ID
        </Label>

        <TextField
          name="id"
          defaultValue={props.signupCode?.id}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="id" className="rw-field-error" />

        <Label
          name="trustStatus"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Trust status
        </Label>

        <TextField
          name="trustStatus"
          defaultValue={props.signupCode?.trustStatus}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="trustStatus" className="rw-field-error" />

        <Label
          name="roles"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Roles
        </Label>

        <TextField
          name="roles"
          defaultValue={props.signupCode?.roles}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="roles" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default SignupCodeForm
