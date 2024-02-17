import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"

import { theme } from "./theme"
import { router } from "./App.tsx"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
        <Notifications />
        <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
)
