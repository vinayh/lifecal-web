import { Suspense } from "react"
import { useLoaderData, useOutlet, Await, useAsyncError } from "react-router-dom"
import { Loader } from "@mantine/core"
import { useAwaitedUser, useUser } from "./useUser"

export const UserLayout = ({ children }) => {
    // const outlet = useOutlet()
    const { userAuth, userProfile, loading } = useUser()
    // const { userPromise } = useLoaderData()

    // const getUserData = () =>
    //     new Promise((resolve, reject) => {
    //         if (!userHasInitialProfile()) {
    //             reject()
    //         } else {
    //             loadProfile()
    //                 .then(user => resolve(user))
    //             setTimeout(() => reject(), 1000)
    //         }
    //     })

    // const UserError = () => {
    //     const error = useAsyncError()
    //     return <div>Error loading user: {error.message}</div>
    // }

    return (loading || !userAuth || !userProfile) ? <Loader /> : children
    // (
    //     <Suspense fallback={<><Loader /><p>{authStatus}, {profileStatus}</p></>}>
    //         {children}
    //     </Suspense>
    // )
}