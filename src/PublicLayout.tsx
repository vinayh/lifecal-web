import { Navigate, Outlet, Link } from "react-router-dom"
import { useUser } from "./useUser"

export const PublicLayout = () => {
    const { user } = useUser()
    
    if (user) {
    return <Navigate to="/dashboard/profile" />
  }

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
      </nav>
      <Outlet />
    </div>
  )
};