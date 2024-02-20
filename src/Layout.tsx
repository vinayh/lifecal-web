import { z } from "zod"
import { useEffect } from "react"
import { useOutlet } from "react-router-dom"
import { AppShell, Burger, LoadingOverlay } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { useDisclosure } from "@mantine/hooks"
import "@mantine/notifications/styles.css"

import { auth, useUserStore } from "./user.ts"
import { Navbar } from "./Navbar.tsx"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserLayout = () => {
    const { loadingProfile, loadingAuth, setAuth } = useUserStore()
    const [opened, { toggle }] = useDisclosure(false)
    const outlet = useOutlet()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            setAuth(newUserAuth)
            return () => unsubscribe()
        })
    }, [])

    return (
        <AppShell
            // header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            {/* <AppShell.Header>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                />
            </AppShell.Header> */}

            <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
            />
            <AppShell.Navbar p="md">
                <Navbar />
            </AppShell.Navbar>

            <AppShell.Main>
                <Notifications position="top-right" />
                <LoadingOverlay visible={loadingProfile || loadingAuth} zIndex={0} overlayProps={{ radius: "sm", blur: 2 }} />
                {(loadingProfile || loadingAuth) ? null : outlet}
            </AppShell.Main>
        </AppShell>
    )
}