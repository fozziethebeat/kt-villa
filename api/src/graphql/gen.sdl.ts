export const schema = gql`
  input GenerateImageRequest {
    id: String!
    prompt: String!
    negative_prompt: String!
    lora: String!
    num_inference_steps: Int
  }

  type GenerateImageResponse {
    image: String!
  }

  type ImageAdapter {
    name: String!
    info: String!
  }

  type ListImageAdapterResponse {
    adapters: [ImageAdapter!]!
  }

  type Query {
    adminListImageAdapters: ListImageAdapterResponse!
      @requireAuth(roles: ["admin"])
  }

  type Mutation {
    adminGenerateImage(input: GenerateImageRequest): GenerateImageResponse!
      @requireAuth(roles: ["admin"])
  }
`
