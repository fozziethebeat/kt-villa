import type { RWGqlError } from '@redwoodjs/forms'
import type { ClaimItemInput } from 'types/graphql'

import {
  Form,
  FormError,
  FieldError,
  Label,
  SelectField,
  Submit,
  TextAreaField,
  TextField,
} from '@redwoodjs/forms'
import { useMutation, useQuery } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

export const QUERY = gql`
  query AdminListImageAdaptersQuery {
    adminListImageAdapters {
      adapters {
        name
        info
      }
    }
  }
`

const MUTATION = gql`
  mutation AdminGenerateImage($input: GenerateImageRequest!) {
    adminGenerateImage(input: $input) {
      image
    }
  }
`
const AdminGenerateImageForm = () => {
  const { loading: loadingAdapters, data: dataAdapters } = useQuery(QUERY)
  const [adminGenerateImage, { data, error, loading }] = useMutation(MUTATION)

  const onGenerate = (input) => {
    adminGenerateImage({
      variables: {
        input,
      },
    })
  }

  return (
    <div className="m-4 flex flex-col gap-4">
      <Form<FormStableItem> onSubmit={onGenerate} error={error}>
        <FormError
          error={error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />
        <div className="flex flex-col gap-2">
          <div className="form-control w-full">
            <label name="id" className="label">
              <span className="label-text">ID</span>
            </label>

            <TextField
              name="id"
              defaultValue="test_image"
              autoComplete="off"
              className="max-w-x input input-bordered input-primary w-full"
              validation={{ required: true }}
            />
            <FieldError name="id" className="label label-text-alt text-error" />
          </div>

          <div className="form-control w-full">
            <label name="prompt" className="label">
              <span className="label-text">Prompt</span>
            </label>

            <TextAreaField
              name="prompt"
              defaultValue="A field of flowers"
              autoComplete="off"
              className="max-w-x textarea textarea-bordered textarea-primary w-full"
              validation={{ required: true }}
            />
            <FieldError
              name="prompt"
              className="label label-text-alt text-error"
            />
          </div>

          <div className="form-control w-full">
            <label name="negative_prompt" className="label">
              <span className="label-text">Negative prompt</span>
            </label>

            <TextAreaField
              name="negative_prompt"
              defaultValue="ugly colors"
              autoComplete="off"
              className="max-w-x textarea textarea-bordered textarea-primary w-full"
              validation={{ required: true }}
            />
            <FieldError
              name="negative_prompt"
              className="label label-text-alt text-error"
            />
          </div>
          <div className="form-control w-full">
            <label name="lora" className="label">
              <span className="label-text">Adapter</span>
            </label>
            <SelectField
              name="lora"
              className="select select-bordered select-primary"
              validation={{ required: true }}
            >
              {dataAdapters?.adminListImageAdapters?.adapters &&
                dataAdapters.adminListImageAdapters.adapters.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
            </SelectField>
            <FieldError
              name="lora"
              className="label label-text-alt text-error"
            />
          </div>

          <div className="">
            <Submit disabled={loading} className="btn btn-primary">
              Generate
            </Submit>
          </div>
        </div>
      </Form>
      {loading && <progress className="progress progress-primary w-56" />}
      <figure className="flex justify-center">
        {data ? (
          <img src={data.adminGenerateImage.image} />
        ) : (
          <div className=" placeholder h-[1024px] w-[1024px] bg-neutral-content" />
        )}
      </figure>
    </div>
  )
}

export default AdminGenerateImageForm
