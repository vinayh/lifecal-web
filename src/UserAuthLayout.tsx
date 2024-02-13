import { useOutlet } from "react-router-dom"
// import { UserLayout } from "./UserLayout"
import { UserProvider } from "./useUser"
import { Loader } from "@mantine/core"
import { Suspense } from "react"

export const UserAuthLayout = () => {
    const outlet = useOutlet()
    return (
        <UserProvider>
            {/* <UserLayout> */}
            <Suspense fallback={<Loader />}>
                {outlet}
            </Suspense>
            {/* </UserLayout> */}
        </UserProvider>
    )
}