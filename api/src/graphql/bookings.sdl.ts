export const schema = gql`
  type Booking {
    id: Int!
    startDate: DateTime!
    endDate: DateTime!
    numGuests: Int!
    status: String!
    bookingCode: String!
  }

  type Query {
    futureBookings: [Booking!]! @skipAuth
    userBookings: [Booking!]! @requireAuth
    userBooking(bookingCode: String!): Booking @requireAuth
    bookings: [Booking!]! @requireAuth
    booking(id: Int!): Booking @requireAuth
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
    createBooking(input: CreateBookingInput!): Booking! @requireAuth
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking! @requireAuth
    deleteBooking(id: Int!): Booking! @requireAuth
  }
`
