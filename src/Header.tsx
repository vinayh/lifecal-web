import { Container, Divider, Group } from "@mantine/core"
import { IconHome2, IconUser, IconLogout, IconLogin, IconCalendar, IconInfoCircle } from "@tabler/icons-react"
import classes from "/public/styles/header.module.css"
import { useNavigate, useLocation } from "react-router-dom"

import { AuthStatus, useUserStore } from "./user"
import { ReactNode } from "react"

const privateLinks = [
    { link: "/", label: "Home", icon: <IconHome2 /> },
    { link: "/dashboard/calendar", label: "Calendar", icon: <IconCalendar /> },
    { link: "/dashboard/profile", label: "Profile", icon: <IconUser /> }
]

const publicLinks = [
    { link: "/", label: "Home", icon: <IconHome2 /> },
    { link: "/about", label: "About", icon: <IconInfoCircle /> }
]

export const Header = () => {
    const { userAuth, authStatus, logout } = useUserStore()
    const navigate = useNavigate()
    const location = useLocation()

    const renderLink = (link: { link: string, label: string, icon: ReactNode }) => {
        return (
            <a
                key={link.label}
                href={link.link}
                className={classes.link}
                data-active={location.pathname === link.link || undefined}
                onClick={(event) => {
                    event.preventDefault()
                    navigate(link.link)
                }}
            >
                {link.icon}
                {link.label}
            </a>
        )
    }
    const links = (userAuth && authStatus !== AuthStatus.NoUser) ? privateLinks : publicLinks
    const logInOutLink = (userAuth && authStatus !== AuthStatus.NoUser) ?
        <a
            key="Log out"
            className={classes.link}
            onClick={(event) => {
                event.preventDefault()
                logout()
                navigate("/")
            }}
        >
            <IconLogout />
            Log out
        </a>
        : renderLink({ link: "/login", label: "Log in", icon: <IconLogin /> })

    return (
        <header className={classes.header}>
            <Container size="md" className={classes.inner}>
                <Group gap={5} visibleFrom="xs">
                    {links.map(renderLink)}
                </Group>
                <Divider my="sm" />
                {logInOutLink}
            </Container>
        </header>
    )
}

