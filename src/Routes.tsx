import "@mantine/core/styles.css"
import {
    Route,
    createBrowserRouter,
    createRoutesFromElements,
} from "react-router-dom"

import { Home } from "./Home"
import { Login } from "./Login"
import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import { PublicLayout } from "./PublicLayout"
import { PrivateLayout } from "./PrivateLayout"
import { Layout } from "./Layout"
import { NotFound404 } from "./NotFound404"

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route element={<PublicLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            <Route path="/" element={<PrivateLayout />}>
                <Route path="profile" element={<UserProfile />} />
                <Route path="calendar" element={<Calendar />} />
            </Route>
            <Route path="*" element={<NotFound404 />} />
        </Route>
    )
)
