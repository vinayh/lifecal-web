import { Suspense } from "react"
import { useLoaderData, useOutlet, Await, useAsyncError } from "react-router-dom"
import { Loader } from "@mantine/core"
import { useAwaitedUser, useUser } from "./useUser"

export const UserLayout = ({ children }) => {
    // const outlet = useOutlet()
    const { loadProfile: updateUser, userStatus, profileStatus, userHasInitialProfile } = useUser()
    // const { userPromise } = useLoaderData()

    // const getUserData = () =>
    //     new Promise((resolve, reject) => {
    //         if (!userHasInitialProfile()) {
    //             reject()
    //         } else {
    //             updateUser()
    //                 .then(user => resolve(user))
    //             setTimeout(() => reject(), 1000)
    //         }
    //     })

    const UserError = () => {
        const error = useAsyncError()
        return <div>Error loading user: {error.message}</div>
    }

    return (
        <Suspense fallback={<><Loader /><p>{userStatus}, {profileStatus}</p></>}>
            {children}
        </Suspense>
    )
}