import { Navigate, Outlet } from "react-router-dom"
import { useUserStore } from "./user"

export const PrivateLayout = () => {
  const { userProfile } = useUserStore()

  if (!userProfile) {
    // TODO: Save original URL to redirect back in case of later successful login
    return <Navigate to="/" />
  }

  return <Outlet />
}