# Design Overview

This document provides an overview of the pages within the application, detailing their purpose and construction.

## Page Structure

The application is organized into three main route groups: `(auth)`, `(guide)`, and `(main)`.

### `(auth)` Route Group

This group handles user authentication.

- **`src/app/(auth)/layout.tsx`**: A simple layout that centers its children on the page. It's used to display the sign-in form in the middle of the screen.

- **`src/app/(auth)/signin/page.tsx`**: The sign-in page. It presents a form for users to log in. This page uses the `SignIn` component, which likely contains the form logic and handles user input.

### `(guide)` Route Group

This group contains the guide for the villa, with content written in MDX.

- **`src/app/(guide)/layout.tsx`**: The layout for the guide pages. It includes a background image and renders the MDX content.

- **`src/app/(guide)/guide/page.mdx`**: The main page of the guide, which likely introduces the guide and provides navigation to other sections.

- **`src/app/(guide)/guide/the-stay/**`**: These pages provide detailed information about staying at the villa, including arriving, departing, finding the house, payment, rooms, and the car.

- **`src/app/(guide)/guide/the-village/**`**: These pages provide information about the local area, including directions, important services, and places to stay.

### `(main)` Route Group

This group contains the core application pages.

- **`src/app/(main)/layout.tsx`**: The main layout for the application. It includes the `AccountMenu` component in the header, providing users with access to their account information and other navigation links.

- **`src/app/(main)/page.tsx`**: The home page of the application. It displays a list of items that can be booked, using the `BookingItemGrid` component.

- **`src/app/(main)/about/page.tsx`**: The about page, which provides information about the villa.

- **`src/app/(main)/admin/page.tsx`**: The admin dashboard. It displays three tables: `AdminBookingTable`, `AdminUsersTable`, and `AdminAdapterTable`, which are used to manage bookings, users, and adapters, respectively.

- **`src/app/(main)/admin/adapter/[id]/page.tsx`**: A page for editing an adapter. It uses the `EditAdapterForm` component to allow admins to modify adapter settings.

- **`src/app/(main)/admin/booking/[id]/page.tsx`**: A page for editing a booking. It uses the `EditAdminBookingForm` component to allow admins to modify booking details.

- **`src/app/(main)/admin/user/[id]/page.tsx`**: A page for editing a user. It uses the `EditUserForm` component to allow admins to modify user information.

- **`src/app/(main)/booking/[id]/page.tsx`**: A page that displays the details of a specific booking. It uses the `UserBookingCard` component to show the booking information.

- **`src/app/(main)/booking/[id]/edit/page.tsx`**: A page that allows users to edit their own bookings. It uses the `EditUserBookingForm` component.

- **`src/app/(main)/item/[id]/page.tsx`**: A page that displays the details of a single bookable item. It includes a `BookingForm` to allow users to book the item.

- **`src/app/(main)/me/page.tsx`**: The user's profile page. It displays the user's bookings using the `MemberBookingsGrid` component and their user details using the `UserDetails` component.

## Components

The application is built using a combination of custom components and components from the Shadcn UI library. Key components include:

- **`AccountMenu`**: Provides account-related navigation.
- **`AdminAdapterTable`**, **`AdminBookingTable`**, **`AdminUsersTable`**: Tables for the admin dashboard.
- **`BookingForm`**: A form for creating new bookings.
- **`BookingItemCard`**, **`BookingItemGrid`**: Components for displaying bookable items.
- **`EditAdapterForm`**, **`EditAdminBookingForm`**, **`EditUserBookingForm`**, **`EditUserForm`**: Forms for editing various data models.
- **`MemberBookingCard`**, **`MemberBookingsGrid`**: Components for displaying a user's bookings.
- **`SignIn`**: The sign-in form.
- **`UserDetails`**: Displays user information.

## Backend

The application uses a GraphQL server for its backend. The frontend interacts with the server through the Apollo Client, which is set up in `src/app/ApolloWrapper.tsx` and `src/graphql/ApolloClient.ts`. The GraphQL schema is defined in `src/graphql/schema.ts`.
