import "@mantine/core/styles.css"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { theme } from "./theme"
import { useState, useEffect } from "react"
import { Route, createBrowserRouter, useRoutes, Navigate, createRoutesFromElements, RouterProvider } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, User, Status, fetchUser } from "./user"
import Login from "./Login"
import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import PrivateRoute from "./PrivateRoute"

export enum UserStatus {
  HasProfile,
  IncompleteProfile,
  LoadingProfile,
  SignedIn,
  LoadingUser,
  NoUser
}

export default function App() {
  const [authUser, authLoading, authError] = useAuthState(auth)
  const [user, setUser] = useState<User | null>(null)
  // const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.NoUser)
  const [loadUserStatus, setLoadUserStatus] = useState<Status>(Status.Loading)
  const [loadUserError, setLoadUserError] = useState<string | undefined>()

  useEffect(() => {
    if (user == null) {
      setLoadUserStatus(Status.Loading)
      fetchUser(authUser)
        .then(res => {
          setLoadUserStatus(res.status)
          if (res.status === Status.Success) {
            console.log(res.user)
            setUser(res.user)
          }
          else { setLoadUserError(res.message) }
        })
    }
  }, [authUser])

  const calendarElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
    <Calendar user={user} />
  </PrivateRoute>

  const profileElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
    <UserProfile user={user} authUser={authUser} />
  </PrivateRoute>

  const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/" element={calendarElement}>
      <Route path="calendar" element={calendarElement} />
      <Route path="login" element={(authUser == null ? <Login /> : <Navigate to={"/calendar"} replace />)} />
      <Route path="profile" element={profileElement} />
    </Route>
  ))

  // const element = useRoutes([
  //   { path: "/", element: calendarElement },
  //   { path: "/calendar", element: calendarElement },
  //   { path: "/login", element: authUser == null ? <Login /> : <Navigate to={"/"} /> },
  //   { path: "/profile", element: profileElement },
  // ])

  return <MantineProvider theme={theme}>
    <Notifications />
    <RouterProvider router={router} />
    {/* {(authUser !== null || authLoading == true) ? element : <Login />} */}
  </MantineProvider>;
}
