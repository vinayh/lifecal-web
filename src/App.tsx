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
  // const [loadUserError, setLoadUserError] = useState<string | undefined>()

  useEffect(() => {
    if (userStatus === UserStatus.NoUser && authUser != null && authError == null) {
      setUserStatus(UserStatus.SignedIn)
    } else if (authUser == null) {
      setUserStatus(UserStatus.NoUser)
    }
    if (userStatus === UserStatus.SignedIn) {
      setUserStatus(UserStatus.LoadingProfile)
      fetchUser(authUser)
        .then(res => {
          if (res.status === LoadStatus.Success) {
            console.log(res.user)
            const result = UserZ.safeParse(res.user)
            if (result.success) {
              setUser(result.data)
              setUserStatus(UserStatus.CompleteProfile)
            } else {
              const initResult = InitialUserZ.safeParse(res.user)
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

  // const calendarElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
  //   <Calendar user={user} />
  // </PrivateRoute>

  // const profileElement = <PrivateRoute authUser={authUser} authLoading={authLoading} user={user} setUser={setUser}>
  //   <UserProfile user={user} authUser={authUser} />
  // </PrivateRoute>

  const InitialProfile = ({ children = <UserProfile user={user} authUser={authUser} /> } = {}) => {
    console.log("InitialProfile -", userStatus)
    if ([UserStatus.CompleteProfile, UserStatus.IncompleteProfile, UserStatus.LoadingProfile, UserStatus.SignedIn].includes(userStatus)) {
      console.log("InitialProfile - loading children")
      return children
    }
    else {
      return <Navigate to="/login" />
    }
  }
  
  const CompleteProfile = ({ children = <Calendar user={user} /> } = {}) => {
    console.log("CompleteProfile -", userStatus)
    if (userStatus === UserStatus.CompleteProfile) {
      console.log("CompleteProfile - loading children")
      return children
    }
    else { return InitialProfile() }
  }

  const PublicOnlyProfile = ({ children = <Login userStatus={userStatus} setUserStatus={setUserStatus} /> } = {}) => {
    console.log("PublicOnlyProfile -", userStatus)
    if (userStatus === UserStatus.IncompleteProfile) {
      return <Navigate to="/profile" />
    } else if (userStatus == UserStatus.CompleteProfile) {
      return <Navigate to="/calendar" />
      // TODO: Address other UserStatus cases such as SignedIn or 
    } else {
      console.log("PublicOnlyProfile - loading children")
      return children
    }
  }

  const router = createBrowserRouter(createRoutesFromElements(
    <>
      <Route index={true} element={<CompleteProfile><Calendar user={user} /></CompleteProfile>} />
      <Route path="calendar" element={<CompleteProfile><Calendar user={user} /></CompleteProfile>} />
      <Route path="profile" element={<InitialProfile><UserProfile user={user} authUser={authUser} /></InitialProfile>} />
      <Route path="login" element={<PublicOnlyProfile><Login userStatus={userStatus} setUserStatus={setUserStatus} /></PublicOnlyProfile>} />
    </>
  ))

  return <MantineProvider theme={theme}>
    User: {userStatus.toString()}
    <Notifications />
    {(userStatus === UserStatus.LoadingProfile || userStatus === UserStatus.SigningIn)
    ? <p>Loading...</p>
    : <RouterProvider router={router} />
    /*{ {(authUser !== null || authLoading == true) ? element : <Login />} */}
  </MantineProvider>;
}
