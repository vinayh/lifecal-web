import { Suspense } from "react"
import { useLoaderData, useOutlet, Await, useAsyncError } from "react-router-dom"
import { Loader } from "@mantine/core"
import { useAwaitedUser, useUser } from "./useUser"
import { AuthStatus } from "./user"

export const UserLayout = ({ children }) => {
    // const outlet = useOutlet()
    const { userAuth, userProfile, authStatus, loading } = useUser()
    // const { userPromise } = useLoaderData()

    return ((loading || !userProfile || !userAuth) && (authStatus !== AuthStatus.NoUser)) ? <Loader /> : children
    // (
    //     <Suspense fallback={<><Loader /><p>{authStatus}, {profileStatus}</p></>}>
    //         {children}
    //     </Suspense>
    // )
}