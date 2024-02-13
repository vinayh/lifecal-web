import { Navigate, Outlet, Link } from "react-router-dom"
import { useUser } from "./useUser"

export const PrivateLayout = () => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <nav>
        <Link to="/profile">Profile</Link>
        <br></br>
        <Link to="/calendar">Calendar</Link>
      </nav>
      <Outlet />
    </div>
  )
};