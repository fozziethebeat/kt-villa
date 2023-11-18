export const schema = gql`
  type User {
    id: Int!
    name: String
    email: String!
    hashedPassword: String!
    salt: String!
    resetToken: String
    resetTokenExpiresAt: DateTime
    roles: String!
    StableItem: [StableItem]!
    booking: [Booking]!
    trustStatus: String!
  }

  type Query {
    users: [User!]! @requireAuth(roles: ["admin"])
    user(id: Int!): User @requireAuth(roles: ["admin"])
  }

  input CreateUserInput {
    name: String
    email: String!
    hashedPassword: String!
    salt: String!
    resetToken: String
    resetTokenExpiresAt: DateTime
    roles: String!
    trustStatus: String
  }

  input UpdateUserInput {
    name: String
    email: String
    hashedPassword: String
    salt: String
    resetToken: String
    resetTokenExpiresAt: DateTime
    roles: String
    trustStatus: String
  }

  type Mutation {
    createUser(input: CreateUserInput!): User! @requireAuth
    updateUser(id: Int!, input: UpdateUserInput!): User! @requireAuth
    deleteUser(id: Int!): User! @requireAuth(roles: ["admin"])
  }
`
