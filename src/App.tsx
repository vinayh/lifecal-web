import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
// import { Link, useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "./user"
import Login from "./Login"
import { Dashboard } from "./Dashboard"

export default function App() {
  const [authUser, authLoading, authError] = useAuthState(auth)

  return <MantineProvider theme={theme}>
    {authLoading ? <>Loading...</> : (authUser ? <Dashboard /> : <Login />)}
  </MantineProvider>;
}
