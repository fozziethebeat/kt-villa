import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/forms'

import type { EditStableItemById, UpdateStableItemInput } from 'types/graphql'
import type { RWGqlError } from '@redwoodjs/forms'

type FormStableItem = NonNullable<EditStableItemById['stableItem']>

interface StableItemFormProps {
  stableItem?: EditStableItemById['stableItem']
  onSave: (data: UpdateStableItemInput, id?: FormStableItem['id']) => void
  error: RWGqlError
  loading: boolean
}

const StableItemForm = (props: StableItemFormProps) => {
  const onSubmit = (data: FormStableItem) => {
    props.onSave(data, props?.stableItem?.id)
  }

  return (
    <div className="rw-form-wrapper">
      <Form<FormStableItem> onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />

        <Label
          name="image"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Image
        </Label>

        <TextField
          name="image"
          defaultValue={props.stableItem?.image}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="image" className="rw-field-error" />

        <Label
          name="text"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Text
        </Label>

        <TextField
          name="text"
          defaultValue={props.stableItem?.text}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: false }}
        />

        <FieldError name="text" className="rw-field-error" />

        <Label
          name="ownerId"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Owner ID
        </Label>

        <TextField
          name="ownerId"
          defaultValue={props.stableItem?.ownerId}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ valueAsNumber: true, required: true }}
        />

        <FieldError name="ownerId" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default StableItemForm
