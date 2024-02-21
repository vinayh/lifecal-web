import { z } from "zod"
import { useEffect } from "react"
import { useOutlet } from "react-router-dom"
import { AppShell, Image, Box, Burger, LoadingOverlay, Group, Center } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { useDisclosure } from "@mantine/hooks"
import "@mantine/notifications/styles.css"

import { auth, useUserStore } from "./user.ts"
import { Navbar } from "./Navbar.tsx"
import logo from "/public/logo.png"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const Layout = () => {
    const { loadingProfile, loadingAuth, setAuth } = useUserStore()
    const [opened, { toggle }] = useDisclosure(false)
    const outlet = useOutlet()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            setAuth(newUserAuth)
            return () => unsubscribe()
        })
    }, [])

    const loader = (
        <Center>
            <LoadingOverlay visible={loadingProfile || loadingAuth} overlayProps={{ radius: "sm", blur: 2 }} />
        </Center>
    )

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 250,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
            padding="xs"
        >
            <AppShell.Header withBorder={false}>
                <Group>
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />
                    <Image src={logo} w="auto" h={50} m={10} />
                </Group>
            </AppShell.Header>
            <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
            />
            <AppShell.Navbar p="md" withBorder={false}>
                <Navbar />
            </AppShell.Navbar>

            <AppShell.Main>
                <Notifications position="top-right" />
                {(loadingProfile || loadingAuth) ? loader : outlet}
            </AppShell.Main>
        </AppShell>
    )
}