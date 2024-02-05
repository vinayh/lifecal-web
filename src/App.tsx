import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
// import { Link, useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "./user"
import Login from "./Login"
import { Dashboard } from "./Dashboard"

export default function App() {
  const [authUser, authLoading, _] = useAuthState(auth)

  return <MantineProvider theme={theme}>
    {authLoading ? <p>Logging in...</p> : (authUser ? <Dashboard /> : <Login />)}
  </MantineProvider>;
}
