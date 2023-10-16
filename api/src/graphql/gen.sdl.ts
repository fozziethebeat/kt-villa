export const schema = gql`
  input GenerateImageRequest {
    id: String!
    prompt: String!
    negative_prompt: String!
  }

  type GenerateImageResponse {
    image: String!
  }

  type Mutation {
    adminGenerateImage(input: GenerateImageRequest): GenerateImageResponse!
      @requireAuth(roles: ["admin"])
  }
`
