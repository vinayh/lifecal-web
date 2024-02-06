import "@mantine/core/styles.css"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { theme } from "./theme"
import { useState, useEffect } from "react"
import { Route, createBrowserRouter, useRoutes, Navigate, createRoutesFromElements, RouterProvider } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, User, UserZ, InitialUserZ, LoadStatus, UserStatus, fetchUser } from "./user"
import Login from "./Login"
import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import PrivateRoute from "./PrivateRoute"

export default function App() {
  const [authUser, authLoading, authError] = useAuthState(auth)
  const [user, setUser] = useState<User | null>(null)
  const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.NoUser)
  const [loadUserError, setLoadUserError] = useState<string | undefined>()

  useEffect(() => {
    if (userStatus === UserStatus.NoUser && authUser != null && authError == null) {
      setUserStatus(UserStatus.SignedIn)
    }
    if (userStatus === UserStatus.SignedIn) {
      setUserStatus(UserStatus.LoadingProfile)
      fetchUser(authUser)
        .then(res => {
          if (res.status === LoadStatus.Success) {
            console.log(res.user)
            const result = UserZ.safeParse(user)
            if (result.success) {
              setUser(result.data)
              setUserStatus(UserStatus.HasProfile)
            } else {
              const initResult = InitialUserZ.safeParse(user)
              if (initResult.success) {
                setUser(initResult.data as User)
                setUserStatus(UserStatus.IncompleteProfile)
              } else {
                setUserStatus(UserStatus.InvalidProfile)
              }
            }
          } else {
            setUserStatus(UserStatus.ProfileLoadError)
          }
        })
    }
  }, [authUser, userStatus])

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

  return <MantineProvider theme={theme}>
    <Notifications />
    <RouterProvider router={router} />
    {/* {(authUser !== null || authLoading == true) ? element : <Login />} */}
  </MantineProvider>;
}
