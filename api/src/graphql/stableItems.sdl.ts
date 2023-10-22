export const schema = gql`
  type StableItem {
    id: String!
    image: String!
    text: String
    claimStatus: String!
    claimVisible: Boolean!
    ownerUsername: String
  }

  type Query {
    stableItems: [StableItem!]! @skipAuth
    stableItem(id: String!): StableItem @skipAuth
  }

  input CreateStableItemInput {
    image: String!
    text: String
  }

  input UpdateStableItemInput {
    image: String
    text: String
  }

  input ClaimItemInput {
    id: String!
    code: String!
  }

  type ClaimItemResponse {
    success: Boolean!
  }

  type Mutation {
    claimItem(input: ClaimItemInput!): StableItem!
      @requireAuth(roles: ["admin", "general"])
    createItemCharacter(id: String!): StableItem! @requireAuth

    createStableItem(input: CreateStableItemInput!): StableItem!
      @requireAuth(roles: ["admin"])
    updateStableItem(id: String!, input: UpdateStableItemInput!): StableItem!
      @requireAuth(roles: ["admin"])
    deleteStableItem(id: String!): StableItem! @requireAuth(roles: ["admin"])
  }
`
