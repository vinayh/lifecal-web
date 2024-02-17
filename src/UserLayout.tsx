import { z } from "zod"
import { useOutlet } from "react-router-dom"
import { Notifications } from "@mantine/notifications"
import { auth, useUserStore } from "./user"
import { useEffect } from "react"
import { Loader } from "@mantine/core"
import { Header } from "./Header"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserLayout = () => {
    const { loadingProfile, loadingAuth, setAuth } = useUserStore()
    const outlet = useOutlet()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            setAuth(newUserAuth)
            return () => unsubscribe()
        })
    }, [])

    return <>
    <Header />
    {(loadingProfile || loadingAuth) ? <Loader /> : outlet}
    </>
}