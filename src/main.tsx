import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { MantineProvider } from "@mantine/core"
import { theme } from "./theme"
import { UserProvider } from "./useUser"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <UserProvider>
        <App />
      </UserProvider>
    </MantineProvider>
  </React.StrictMode>
)
