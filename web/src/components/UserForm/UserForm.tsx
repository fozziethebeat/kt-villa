import {
  DatetimeLocalField,
  Form,
  FormError,
  FieldError,
  Label,
  NumberField,
  TextField,
  Submit,
} from '@redwoodjs/forms'

const UserForm = ({ user, onSave, error, loading }) => {
  const onSubmit = (data) => {
    onSave(data, user?.id)
  }
  return (
    <Form onSubmit={onSubmit} error={error}>
      <FormError
        error={error}
        wrapperClassName="rw-form-error-wrapper"
        titleClassName="rw-form-error-title"
        listClassName="rw-form-error-list"
      />

      <Label
        name="name"
        className="label"
        errorClassName="rw-label rw-label-error"
      >
        Name
      </Label>

      <TextField
        name="name"
        defaultValue={user?.name}
        type="search"
        className="input input-bordered w-full"
        errorClassName="rw-input rw-input-error"
        validation={{ required: true }}
      />

      <FieldError name="name" className="rw-field-error" />

      <Label
        name="email"
        className="label"
        errorClassName="rw-label rw-label-error"
      >
        Adapter
      </Label>

      <TextField
        name="email"
        type="search"
        defaultValue={user?.email}
        className="input input-bordered w-full"
        errorClassName="rw-input rw-input-error"
        validation={{ required: true }}
      />

      <FieldError name="email" className="rw-field-error" />

      <Label
        name="roles"
        className="label"
        errorClassName="rw-label rw-label-error"
      >
        Roles
      </Label>

      <TextField
        name="roles"
        type="search"
        defaultValue={user?.roles}
        className="input input-bordered w-full"
        errorClassName="rw-input rw-input-error"
        validation={{ required: true }}
      />

      <FieldError name="roles" className="rw-field-error" />

      <div className="rw-button-group">
        <Submit disabled={loading} className="btn btn-primary">
          Save
        </Submit>
      </div>
    </Form>
  )
}

export default UserForm
