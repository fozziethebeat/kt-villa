import type { RWGqlError } from '@redwoodjs/forms'
import type { ClaimItemInput } from 'types/graphql'

import {
  Form,
  FormError,
  FieldError,
  Label,
  TextField,
  Submit,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY as StableItemQuery } from 'src/components/StableItemCell'

const CLAIM_ITEM_MUTATION = gql`
  mutation ClaimItemMutation($input: ClaimItemInput!) {
    claimItem(input: $input) {
      claimStatus
    }
  }
`
const ClaimForm = ({ item }) => {
  const [claimItem, { loading, error }] = useMutation(CLAIM_ITEM_MUTATION, {
    refetchQueries: [{ query: StableItemQuery, variables: { id: item.id } }],
    onCompleted: () => {
      toast.success('StableItem claimed')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSave = (input: ClaimItemInput) => {
    claimItem({
      variables: {
        input: {
          id: item.id,
          ...input,
        },
      },
    })
  }

  return (
    <div className="rw-form-wrapper">
      <Form<FormStableItem> onSubmit={onSave} error={error}>
        <FormError
          error={error}
          wrapperClassName="rw-form-error-wrapper"
          titleClassName="rw-form-error-title"
          listClassName="rw-form-error-list"
        />

        <Label
          name="code"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Code
        </Label>

        <TextField
          name="code"
          defaultValue=""
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          validation={{ required: true }}
        />

        <FieldError name="code" className="rw-field-error" />

        <div className="rw-button-group">
          <Submit disabled={loading} className="rw-button rw-button-blue">
            Save
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default ClaimForm
