export const schema = gql`
  type Booking {
    id: Int!
    startDate: DateTime!
    endDate: DateTime!
    numGuests: Int!
    status: String!
    bookingCode: String!
    item: StableItem
  }

  type AdminBooking {
    id: Int!
    startDate: DateTime!
    endDate: DateTime!
    numGuests: Int!
    status: String!
    bookingCode: String!
    user: User
    item: StableItem
  }

  type Query {
    adminBookings: [AdminBooking!]! @requireAuth(roles: ["admin"])
    bookings: [Booking!]! @requireAuth
    booking(id: Int!): Booking @requireAuth
    futureBookings: [Booking!]! @skipAuth
    userBookings: [Booking!]! @requireAuth
    userBooking(bookingCode: String!): Booking @requireAuth
  }

  input CreateBookingInput {
    startDate: DateTime!
    endDate: DateTime!
    numGuests: Int!
  }

  input UpdateBookingInput {
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    userId: Int
  }

  type Mutation {
    createBookingItemAdmin(id: Int!): AdminBooking!
      @requireAuth(roles: ["admin"])
    updateBookingStatus(id: Int!, status: String!): AdminBooking!
      @requireAuth(roles: ["admin"])

    createBooking(input: CreateBookingInput!): Booking!
      @requireAuth(roles: ["admin"])
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking!
      @requireAuth(roles: ["admin"])
    deleteBooking(id: Int!): Booking! @requireAuth(roles: ["admin"])
  }
`