import { useOutlet } from "react-router-dom"
import { UserLayout } from "./UserLayout"
import { UserProvider } from "./useUser"

export const UserAuthLayout = () => {
    const outlet = useOutlet()
    return (
        <UserProvider>
            <UserLayout>{outlet}</UserLayout>
        </UserProvider>
    )
}