export const schema = gql`
  type SignupCode {
    id: String!
    trustStatus: String!
    roles: String!
  }

  type Query {
    signupCodes: [SignupCode!]! @requireAuth
    signupCode(id: String!): SignupCode @requireAuth
  }

  input CreateSignupCodeInput {
    trustStatus: String!
    roles: String!
  }

  input UpdateSignupCodeInput {
    trustStatus: String
    roles: String
  }

  type Mutation {
    createSignupCode(input: CreateSignupCodeInput!): SignupCode! @requireAuth
    updateSignupCode(id: String!, input: UpdateSignupCodeInput!): SignupCode!
      @requireAuth
    deleteSignupCode(id: String!): SignupCode! @requireAuth
  }
`
