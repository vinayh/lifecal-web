import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { MantineProvider } from "@mantine/core"

import { theme } from "./theme"
import { router } from "./Routes.tsx"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={theme}>
            <RouterProvider router={router} />
        </MantineProvider>
    </React.StrictMode>
)
