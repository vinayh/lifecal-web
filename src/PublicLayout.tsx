import { Navigate, Outlet } from "react-router-dom"
import { ProfileStatus, useUserStore } from "./user"

export const PublicLayout = () => {
  const { userProfile, profileStatus } = useUserStore()

  if (userProfile) {
    const target = (profileStatus === ProfileStatus.CompleteProfile
      ? "/dashboard/calendar"
      : "/dashboard/profile")
      return <Navigate to={target} />
  }
  
  return <Outlet />
}