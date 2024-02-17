import { Navigate, Outlet, Link } from "react-router-dom"
import { useUserStore } from "./user"

export const PrivateLayout = () => {
  const { userProfile, logout } = useUserStore()

  if (!userProfile) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <nav>
        <a href="#" onClick={logout}>Log out</a>
        <br></br>
        <Link to="/dashboard/profile">Profile</Link>
        <br></br>
        <Link to="/dashboard/calendar">Calendar</Link>
      </nav>
      <Outlet />
    </div>
  )
};