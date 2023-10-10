// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Private, Router, Route, Set } from '@redwoodjs/router'

import ScaffoldLayout from 'src/layouts/ScaffoldLayout'
import GeneralLayout from 'src/layouts/GeneralLayout'

import { useAuth } from './auth'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/signup" page={SignupPage} name="signup" />
      <Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />
      <Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />

      <Private unauthenticated="home" roles="admin">
        <Set wrap={ScaffoldLayout} title="StableItems" titleTo="adminStableItems" buttonLabel="New StableItem" buttonTo="adminNewStableItem">
          <Route path="/admin/stable-items/new" page={AdminStableItemNewStableItemPage} name="adminNewStableItem" />
          <Route path="/admin/stable-items/{id}/edit" page={AdminStableItemEditStableItemPage} name="adminEditStableItem" />
          <Route path="/admin/stable-items/{id}" page={AdminStableItemStableItemPage} name="adminStableItem" />
          <Route path="/admin/stable-items" page={AdminStableItemStableItemsPage} name="adminStableItems" />
        </Set>
      </Private>
      <Set wrap={GeneralLayout}>
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/booking/{bookingCode}" page={UserBookingPage} name="userBooking" />
        <Route path="/item/{id}" page={ItemPage} name="item" />
        <Route path="/me" page={MyPage} name="me" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
