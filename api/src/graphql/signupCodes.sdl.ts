export const schema = gql`
  type SignupCode {
    id: String!
    trustStatus: String!
  }

  type Query {
    signupCodes: [SignupCode!]! @requireAuth
    signupCode(id: String!): SignupCode @requireAuth
  }

  input CreateSignupCodeInput {
    trustStatus: String!
  }

  input UpdateSignupCodeInput {
    trustStatus: String
  }

  type Mutation {
    createSignupCode(input: CreateSignupCodeInput!): SignupCode! @requireAuth
    updateSignupCode(id: String!, input: UpdateSignupCodeInput!): SignupCode!
      @requireAuth
    deleteSignupCode(id: String!): SignupCode! @requireAuth
  }
`
