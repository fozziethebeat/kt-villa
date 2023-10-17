export const schema = gql`
  type ImageAdapterSetting {
    id: Int!
    startDate: DateTime!
    adapter: String!
  }

  type Query {
    imageAdapterSettings: [ImageAdapterSetting!]! @requireAuth
    imageAdapterSetting(id: Int!): ImageAdapterSetting @requireAuth
  }

  input CreateImageAdapterSettingInput {
    startDate: DateTime!
    adapter: String!
  }

  input UpdateImageAdapterSettingInput {
    startDate: DateTime
    adapter: String
  }

  type Mutation {
    createImageAdapterSetting(
      input: CreateImageAdapterSettingInput!
    ): ImageAdapterSetting! @requireAuth
    updateImageAdapterSetting(
      id: Int!
      input: UpdateImageAdapterSettingInput!
    ): ImageAdapterSetting! @requireAuth
    deleteImageAdapterSetting(id: Int!): ImageAdapterSetting! @requireAuth
  }
`
