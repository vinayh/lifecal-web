import "@mantine/core/styles.css"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { theme } from "./theme"
import { useState } from "react"
import { Routes, Route, useRoutes, Navigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, User } from "./user"
import Login from "./Login"
import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import PrivateRoute from "./PrivateRoute"

export default function App() {
  const [authUser, authLoading, authError] = useAuthState(auth)
  const [user, setUser] = useState<User | null>(null)

  const calendarElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
    <Calendar user={user} />
  </PrivateRoute>

  const profileElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
    <UserProfile user={user} authUser={authUser} />
  </PrivateRoute>

  const element = useRoutes([
    { index: true, element: calendarElement },
    { path: "/calendar", element: calendarElement },
    { path: "/login", element: authUser == null ? <Login /> : <Navigate to={"/"} /> },
    { path: "/profile", element: profileElement },
  ])

  return <MantineProvider theme={theme}>
    <p>Home</p>
    <Notifications />
    {(authUser !== null || authLoading == true) ? element : <Login />}
  </MantineProvider>;
}
