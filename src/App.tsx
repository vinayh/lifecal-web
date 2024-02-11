import "@mantine/core/styles.css"
import { Notifications } from "@mantine/notifications"
import { Route, createBrowserRouter, useRoutes, Navigate, createRoutesFromElements, RouterProvider } from "react-router-dom"

import { UserStatus, ProfileStatus } from "./user"
import Login from "./Login"
import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import { useUser } from "./useUser"
// import PrivateRoute from "./PrivateRoute"

export default function App() {
  const { userStatus, profileStatus, logout } = useUser()

  // const calendarElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
  //   <Calendar user={user} />
  // </PrivateRoute>

  // const profileElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
  //   <UserProfile user={user} authUser={authUser} />
  // </PrivateRoute>

  const InitialProfile = ({ children = <UserProfile /> } = {}) => {
    // console.log("InitialProfile -", userStatus)
    if (userStatus === UserStatus.SignedIn && [ProfileStatus.CompleteProfile, ProfileStatus.IncompleteProfile, ProfileStatus.LoadingProfile].includes(profileStatus)) {
      console.log("InitialProfile - loading children")
      return children
    }
    else {
      return <Navigate to="/login" />
    }
  }

  const CompleteProfile = ({ children = <Calendar /> } = {}) => {
    // console.log("CompleteProfile -", userStatus)
    if (profileStatus === ProfileStatus.CompleteProfile) {
      console.log("CompleteProfile - loading children")
      return children
    }
    else {
      return InitialProfile()
    }
  }

  const PublicOnlyProfile = ({ children = <Login /> } = {}) => {
    // console.log("PublicOnlyProfile -", userStatus)
    if (profileStatus === ProfileStatus.IncompleteProfile) {
      return <Navigate to="/profile" />
    } else if (profileStatus == ProfileStatus.CompleteProfile) {
      return <Navigate to="/calendar" />
      // TODO: Address other UserStatus cases such as SignedIn
    } else if ([UserStatus.NoUser, UserStatus.SigningIn, UserStatus.SignInError].includes(userStatus)) {
      console.log("PublicOnlyProfile - loading children")
      return children
    }
  }

  const router = createBrowserRouter(createRoutesFromElements(
    <>
      <Route index={true} element={<CompleteProfile><UserProfile /></CompleteProfile>} />
      <Route path="calendar" element={<CompleteProfile><Calendar /></CompleteProfile>} />
      <Route path="profile" element={<InitialProfile><UserProfile /></InitialProfile>} />
      <Route path="login" element={<PublicOnlyProfile><Login /></PublicOnlyProfile>} />
    </>
  ))

  return <>
      {/* User: {userStatus.toString()} */}
      <button name="logoutButton" onClick={logout}>Log out</button>
      <Notifications />
      {(profileStatus === ProfileStatus.LoadingProfile || userStatus === UserStatus.SigningIn)
        ? <p>Loading...</p>
        : <RouterProvider router={router} />}
    {/* {(authUser !== null || authLoading == true) ? element : <Login />} */}
    </>
}