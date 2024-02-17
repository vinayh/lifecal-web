import { Navigate, Outlet } from "react-router-dom"
import { useUserStore } from "./user"

export const PublicLayout = () => {
  const { userProfile } = useUserStore()

  if (userProfile) {
    return <Navigate to="/dashboard/profile" />
  }

  return <Outlet />
}