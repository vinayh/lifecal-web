import { z } from "zod"
import { Loader } from "@mantine/core"
import { useEffect } from "react"
import { useNavigate, useOutlet } from "react-router-dom"

import { auth, useUserStore } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserLayout = () => {
    const outlet = useOutlet()
    const navigate = useNavigate()
    const { userProfile, userAuth, authStatus, loadingProfile, loadingAuth, setAuth } = useUserStore()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            setAuth(newUserAuth)
            return () => unsubscribe()
        })
    }, [])

    return <>
        {/* <p>loading profile {JSON.stringify(loadingProfile)}, auth {JSON.stringify(loadingAuth)}
            <br></br>
            userProfile {JSON.stringify(userProfile)}
            <br></br>
            userAuth {JSON.stringify(userAuth)}
            <br></br>
            authStatus {authStatus}</p> */}
        {(loadingProfile || loadingAuth) ? <Loader /> : outlet}
    </>
}