import { useEffect } from "react"
// import { useLoaderData, useOutlet, Await, useAsyncError } from "react-router-dom"
import { Loader } from "@mantine/core"
import { useUser } from "./useUser"
import { AuthStatus } from "./user"

export const UserLayout = ({ children }) => {
    // const outlet = useOutlet()
    const { userAuth, userProfile, authStatus, loadingProfile, loadingAuth } = useUser()
    var isLoading: boolean = false

    useEffect(() => {
        const unsubscribe = () => {
            isLoading = (loadingProfile || loadingAuth || !userProfile || !userAuth) && (authStatus !== AuthStatus.NoUser)
            return () => unsubscribe()
        }
    }, [loadingProfile, loadingAuth, userProfile, userAuth, authStatus])

    
    return <>
    <p>loading profile {JSON.stringify(loadingProfile)}, auth {JSON.stringify(loadingAuth)}
    <br></br>
    userProfile {JSON.stringify(userProfile)}
    <br></br>
    userAuth {JSON.stringify(userAuth)}
    <br></br>
    authStatus {authStatus}</p>
    {isLoading ? <Loader /> : children}
    </>
}