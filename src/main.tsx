import React from "react";
import ReactDOM from "react-dom/client";
import App, { router } from "./App.tsx";
import { MantineProvider } from "@mantine/core"
import { theme } from "./theme"
import { RouterProvider } from "react-router-dom"
// import { UserProvider } from "./useUser"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
        <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
)
