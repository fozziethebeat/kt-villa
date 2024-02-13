import type {
  FindStableItemQuery,
  FindStableItemQueryVariables,
} from 'types/graphql'
import type { CellSuccessProps, CellFailureProps } from '@redwoodjs/web'

import { Form, Submit } from '@redwoodjs/forms'
import { useMutation, MetaTags } from '@redwoodjs/web'

import ClaimForm from 'src/components/ClaimForm'
import StableItemChat from 'src/components/StableItemChat'

export const QUERY = gql`
  query FindStableItemQuery($id: String!) {
    stableItem: stableItem(id: $id) {
      id
      image
      text
      claimStatus
      claimVisible
      ownerUsername
    }
  }
`

const MUTATION = gql`
  mutation CreateItemCharacter($id: String!) {
    createItemCharacter(id: $id) {
      id
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({
  error,
}: CellFailureProps<FindStableItemQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

export const Success = ({
  stableItem,
}: CellSuccessProps<FindStableItemQuery, FindStableItemQueryVariables>) => {
  console.log(stableItem.image)
  return (
    <>
      <head>
        <meta property="og:image" content={stableItem.image} />
      </head>
      <div className="min-h-screen w-full bg-neutral-200">
        <div className="hero-content flex-col items-start lg:flex-row">
          <figure className="h-[512px]  w-[512px]">
            <img src={stableItem.image} />
          </figure>
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold">Item Code: {stableItem.id}</h2>
            <div className="flex justify-between gap-2">
              <div>Owner</div>
              <div className="badge badge-neutral badge-lg">
                {stableItem.ownerUsername}
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <div>Claimed</div>
              <div className="badge badge-primary badge-lg">
                {stableItem.claimStatus}
              </div>
            </div>

            <StableItemProfile stableItem={stableItem} />
          </div>
        </div>
        <StableItemChat stableItem={stableItem} />
        <div>
          {stableItem.claimStatus === 'unclaimed' && (
            <ClaimForm item={stableItem} />
          )}
        </div>
      </div>
    </>
  )
}

const StableItemProfile = ({ stableItem }) => {
  const [createItemCharacter, { loading, error }] = useMutation(MUTATION, {
    refetchQueries: [{ query: QUERY, variables: { id: stableItem.id } }],
  })

  const onSubmit = () => {
    createItemCharacter({
      variables: {
        id: stableItem.id,
      },
    })
  }

  if (stableItem.ownerUsername !== 'you') {
    return <></>
  }

  if (!stableItem.text) {
    return (
      <Form onSubmit={onSubmit} error={error} className="flex flex-col gap-2">
        <Submit disabled={loading} className="btn btn-primary">
          {loading && <span className="loading loading-spinner"></span>}
          Create Character
        </Submit>
      </Form>
    )
  }

  return (
    <div className="flex justify-between gap-2">
      <div>Character</div>
      <div className="w-96 text-sm">{stableItem.text}</div>
    </div>
  )
}
