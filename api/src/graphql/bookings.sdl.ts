export const schema = gql`
  type Booking {
    id: Int!
    startDate: DateTime!
    endDate: DateTime!
    numGuests: Int!
    maxGuests: Int!
    withCat: Boolean!
    withDog: Boolean!
    status: String!
    bookingCode: String!
    item: StableItem
    member: [MemberBooking!]
  }

  type MemberBooking {
    id: Int!
    status: String!
    user: User!
    booking: Booking!
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
    # Fetch even more booking info for admins.
    adminBookings: [AdminBooking!]! @requireAuth(roles: ["admin"])
    # Fetch all bookings.
    bookings: [Booking!]! @requireAuth
    # Fetch a specific booking.
    booking(id: Int!): Booking @requireAuth
    # Fetch all upcoming bookings that exist.
    futureBookings: [Booking!]! @skipAuth
    # Fetch all bookings where the signed in user is joining.
    memberBookings: [MemberBooking!]! @requireAuth
    # Fetch all public bookings where a user can request to join.
    publicBookings(limit: Int): [Booking!]! @skipAuth
    # Fetch all details about a specific public booking.
    publicBooking(bookingCode: String!): Booking @skipAuth

    # Fetch all bookings hosted by the signed in user.
    userBookings: [Booking!]! @requireAuth
    # Fetch details about a specific booking hosted by the signed in user.
    userBooking(bookingCode: String!): Booking @requireAuth
  }

  input CreateBookingInput {
    startDate: DateTime!
    endDate: DateTime!
    maxGuests: Int!
    numGuests: Int!
    withCat: Boolean
    withDog: Boolean
  }

  input UpdateBookingInput {
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    maxGuests: Int
    userId: Int
    withCat: Boolean
    withDog: Boolean
  }

  type Mutation {
    joinBooking(bookingCode: String!): Booking! @requireAuth
    addMemberBooking(id: Int!, username: String!): Booking! @requireAuth
    updateMemberBookingStatus(id: Int!, status: String!): MemberBooking!
      @requireAuth

    createBookingItemAdmin(id: Int!): AdminBooking!
      @requireAuth(roles: ["admin"])
    updateBookingStatus(id: Int!, status: String!): AdminBooking!
      @requireAuth(roles: ["admin"])

    createBooking(input: CreateBookingInput!): Booking!
      @requireAuth(roles: ["trusted", "admin"])
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking!
      @requireAuth(roles: ["trusted", "admin"])
    deleteBooking(id: Int!): Booking! @requireAuth(roles: ["admin"])
  }
`
