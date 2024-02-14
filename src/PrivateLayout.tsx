import { Navigate, Outlet, Link } from "react-router-dom"
import { useUser } from "./useUser"

export const PrivateLayout = () => {
  const { userProfile: user } = useUser();

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <nav>
        <Link to="/dashboard/profile">Profile</Link>
        <br></br>
        <Link to="/dashboard/calendar">Calendar</Link>
      </nav>
      <Outlet />
    </div>
  )
};