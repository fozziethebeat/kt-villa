export const schema = gql`
  type ImageAdapterSetting {
    id: Int!
    startDate: DateTime!
    adapter: String!
    promptTemplate: String!
    negativePrompt: String!
    steps: Int!
    variants: [String!]!
  }

  type Query {
    imageAdapterSettings: [ImageAdapterSetting!]! @requireAuth
    imageAdapterSetting(id: Int!): ImageAdapterSetting @requireAuth
  }

  input CreateImageAdapterSettingInput {
    startDate: DateTime!
    adapter: String!
    promptTemplate: String!
    negativePrompt: String!
    steps: Int!
    variants: [String!]!
  }

  input UpdateImageAdapterSettingInput {
    startDate: DateTime
    adapter: String
    promptTemplate: String
    negativePrompt: String
    steps: Int
    variants: [String!]
  }

  type TestImageAdapterResponse {
    image: String!
  }

  type Mutation {
    createImageAdapterSetting(
      input: CreateImageAdapterSettingInput!
    ): ImageAdapterSetting! @requireAuth(roles: ["admin"])
    updateImageAdapterSetting(
      id: Int!
      input: UpdateImageAdapterSettingInput!
    ): ImageAdapterSetting! @requireAuth(roles: ["admin"])
    deleteImageAdapterSetting(id: Int!): ImageAdapterSetting!
      @requireAuth(roles: ["admin"])

    testImageAdapter(id: Int!): TestImageAdapterResponse!
      @requireAuth(roles: ["admin"])
  }
`
