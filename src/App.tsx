import "@mantine/core/styles.css"
import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom"

import Login from "./Login"
import Home from "./Home"

import { Calendar } from "./Calendar"
import { UserProfile } from "./UserProfile"
import { PublicLayout } from "./PublicLayout"
import { PrivateLayout } from "./PrivateLayout"
import { UserLayout } from "./UserLayout"

export const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<UserLayout />}>
      <Route path="/" element={<Home />} />
    <Route element={<PublicLayout />}>
      <Route path="/login" element={<Login />} />
    </Route>

    <Route path="/" element={<PrivateLayout />}>
      <Route path="profile" element={<UserProfile />} />
      <Route path="calendar" element={<Calendar />} />
    </Route>
  </Route>
))