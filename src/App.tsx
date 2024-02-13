import "@mantine/core/styles.css"
import { Notifications } from "@mantine/notifications"
import { Route, createBrowserRouter, useRoutes, Navigate, createRoutesFromElements, RouterProvider, defer } from "react-router-dom"

import { AuthStatus, ProfileStatus } from "./user"
import Login from "./Login"
import Home from "./Home"

import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import { UserProvider, useUser } from "./useUser"
import { PublicLayout } from "./PublicLayout"
import { PrivateLayout } from "./PrivateLayout"
import { UserLayout } from "./UserLayout"
import { UserAuthLayout } from "./UserAuthLayout"

// import PrivateRoute from "./PrivateRoute"

// export default function App() {
//   const { userStatus, profileStatus, logout } = useUser()

//   // const calendarElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
//   //   <Calendar user={user} />
//   // </PrivateRoute>

//   // const profileElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
//   //   <UserProfile user={user} authUser={authUser} />
//   // </PrivateRoute>

//   const InitialProfile = ({ children = <UserProfile /> } = {}) => {
//     // console.log("InitialProfile -", userStatus)
//     if (userStatus === UserStatus.SignedIn && [ProfileStatus.CompleteProfile, ProfileStatus.IncompleteProfile, ProfileStatus.LoadingProfile].includes(profileStatus)) {
//       console.log("InitialProfile - loading children")
//       return children
//     }
//     else {
//       return <Navigate to="/login" />
//     }
//   }

//   const CompleteProfile = ({ children = <Calendar /> } = {}) => {
//     // console.log("CompleteProfile -", userStatus)
//     if (profileStatus === ProfileStatus.CompleteProfile) {
//       console.log("CompleteProfile - loading children")
//       return children
//     }
//     else {
//       return InitialProfile()
//     }
//   }

//   const PublicOnlyProfile = ({ children = <Login /> } = {}) => {
//     // console.log("PublicOnlyProfile -", userStatus)
//     if (profileStatus === ProfileStatus.IncompleteProfile) {
//       return <Navigate to="/profile" />
//     } else if (profileStatus == ProfileStatus.CompleteProfile) {
//       return <Navigate to="/calendar" />
//       // TODO: Address other UserStatus cases such as SignedIn
//     } else if ([UserStatus.NoUser, UserStatus.SigningIn, UserStatus.SignInError].includes(userStatus)) {
//       console.log("PublicOnlyProfile - loading children")
//       return children
//     }
//   }



//   return <>
//       {/* User: {userStatus.toString()} */}
//       <button name="logoutButton" onClick={logout}>Log out</button>
//       <Notifications />
//       {(profileStatus === ProfileStatus.LoadingProfile || userStatus === UserStatus.SigningIn)
//         ? <p>Loading...</p>
//         : <RouterProvider router={router} />}
//     {/* {(authUser !== null || authLoading == true) ? element : <Login />} */}
//     </>
// }

export const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<UserAuthLayout />}>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Route>

    <Route path="/dashboard" element={<PrivateLayout />}>
      <Route path="profile" element={<UserProfile />} />
      <Route path="calendar" element={<Calendar />} />
    </Route>
    {/* <Route index={true} element={<CompleteProfile><UserProfile /></CompleteProfile>} />
    <Route path="calendar" element={<CompleteProfile><Calendar /></CompleteProfile>} />
    <Route path="profile" element={<InitialProfile><UserProfile /></InitialProfile>} />
    <Route path="login" element={<PublicOnlyProfile><Login /></PublicOnlyProfile>} /> */}
  </Route>
))