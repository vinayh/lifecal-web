import { useNavigate, useOutlet } from "react-router-dom"
import { useUserStore } from "./user"

export const PrivateLayout = () => {
  const { userProfile } = useUserStore()
  const navigate = useNavigate()
  const outlet = useOutlet()

  if (!userProfile) {
    // TODO: Save original URL to redirect back in case of later successful login
    navigate("/")
  }

  return outlet
}