import {
  Form,
  FormError,
  FieldError,
  Label,
  DatetimeLocalField,
  TextField,
  Submit,
} from '@redwoodjs/forms'

import type {
  EditImageAdapterSettingById,
  UpdateImageAdapterSettingInput,
} from 'types/graphql'
import type { RWGqlError } from '@redwoodjs/forms'

const formatDatetime = (value) => {
  if (value) {
    return value.replace(/:\d{2}\.\d{3}\w/, '')
  }
}

type FormImageAdapterSetting = NonNullable<
  EditImageAdapterSettingById['imageAdapterSetting']
>

interface ImageAdapterSettingFormProps {
  imageAdapterSetting?: EditImageAdapterSettingById['imageAdapterSetting']
  onSave: (
    data: UpdateImageAdapterSettingInput,
    id?: FormImageAdapterSetting['id']
  ) => void
  error: RWGqlError
  loading: boolean
}

const ImageAdapterSettingForm = (props: ImageAdapterSettingFormProps) => {
  const onSubmit = (data: FormImageAdapterSetting) => {
    props.onSave(data, props?.imageAdapterSetting?.id)
  }

  return (
    <div className="rw-form-wrapper">
      <Form<FormImageAdapterSetting> onSubmit={onSubmit} error={props.error}>
        <FormError
          error={props.error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />

        <Label
          name="startDate"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Start date
        </Label>

        <DatetimeLocalField
          name="startDate"
          defaultValue={formatDatetime(props.imageAdapterSetting?.startDate)}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="startDate" className="rw-field-error" />

        <Label
          name="adapter"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Adapter
        </Label>

        <TextField
          name="adapter"
          defaultValue={props.imageAdapterSetting?.adapter}
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="adapter" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default ImageAdapterSettingForm
