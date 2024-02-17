import { Navigate, Outlet, Link } from "react-router-dom"
import { useUserStore } from "./user"

export const PublicLayout = () => {
  const { userProfile } = useUserStore()

  if (userProfile) {
    return <Navigate to="/dashboard/profile" />
  }

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <br></br>
        <Link to="/login">Login</Link>
      </nav>
      <Outlet />
    </div>
  )
}