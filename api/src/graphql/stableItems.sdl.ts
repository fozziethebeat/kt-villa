export const schema = gql`
  type StableItem {
    id: String!
    image: String!
    text: String!
  }

  type Query {
    stableItems: [StableItem!]! @skipAuth
    stableItem(id: String!): StableItem @skipAuth
  }

  input CreateStableItemInput {
    image: String!
    text: String!
  }

  input UpdateStableItemInput {
    image: String
    text: String
  }

  type Mutation {
    createStableItem(input: CreateStableItemInput!): StableItem!
      @requireAuth(roles: ["admin"])
    updateStableItem(id: String!, input: UpdateStableItemInput!): StableItem!
      @requireAuth(roles: ["admin"])
    deleteStableItem(id: String!): StableItem! @requireAuth(roles: ["admin"])
  }
`
