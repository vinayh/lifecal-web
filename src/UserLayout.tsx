import { z } from "zod"
import { useOutlet } from "react-router-dom"
import { Notifications } from "@mantine/notifications"
import { auth, useUserStore } from "./user"
import { useEffect } from "react"
import { Center, Container, Loader, LoadingOverlay, Paper } from "@mantine/core"
import { Header } from "./Header"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserLayout = () => {
    const { loadingProfile, loadingAuth, userProfile, setAuth } = useUserStore()
    const outlet = useOutlet()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            setAuth(newUserAuth)
            return () => unsubscribe()
        })
    }, [])

    return <>
        <Header />
        <Center>
            <Container maw={1000} mt={0}>
                <LoadingOverlay visible={loadingProfile || loadingAuth} zIndex={0} overlayProps={{ radius: "sm", blur: 2 }} />
                {(loadingProfile || loadingAuth) ? null : outlet}
            </Container>
        </Center>
    </>
}