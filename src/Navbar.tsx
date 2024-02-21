import { ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
    IconHome2,
    IconUser,
    IconLogout,
    IconLogin,
    IconCalendar,
    IconInfoCircle,
    Icon,
} from "@tabler/icons-react"

import { AuthStatus, useUserStore } from "./user"
import classes from "/public/styles/navbar.module.css"

type NavbarItem = {
    link: string
    label: string
    icon: Icon
    onClick: (() => void) | undefined
}

const privateLinks: NavbarItem[] = [
    { link: "/", label: "Home", icon: IconHome2, onClick: undefined },
    {
        link: "/calendar",
        label: "Calendar",
        icon: IconCalendar,
        onClick: undefined,
    },
    { link: "/profile", label: "Profile", icon: IconUser, onClick: undefined },
]

const publicLinks: NavbarItem[] = [
    { link: "/", label: "Home", icon: IconHome2, onClick: undefined },
    {
        link: "/about",
        label: "About",
        icon: IconInfoCircle,
        onClick: undefined,
    },
]

export const Navbar = () => {
    const { userAuth, authStatus, logout } = useUserStore()
    const navigate = useNavigate()
    const location = useLocation()

    const logInOut =
        userAuth && authStatus !== AuthStatus.NoUser
            ? { link: "/", label: "Log out", icon: IconLogout, onClick: logout }
            : {
                  link: "/login",
                  label: "Log in",
                  icon: IconLogin,
                  onClick: undefined,
              }

    const data =
        userAuth && authStatus !== AuthStatus.NoUser
            ? privateLinks
            : publicLinks

    const renderItem = (item: NavbarItem): ReactNode => {
        return (
            <a
                className={classes.link}
                data-active={location.pathname === item.link || undefined}
                href={item.link ? item.link : "#"}
                key={item.label}
                onClick={event => {
                    event.preventDefault()
                    if (item.onClick) {
                        item.onClick()
                    }
                    navigate(item.link)
                }}
            >
                <item.icon className={classes.linkIcon} stroke={1.5} />
                <span>{item.label}</span>
            </a>
        )
    }

    return (
        <nav className={classes.navbar}>
            <div className={classes.navbarMain}>{data.map(renderItem)}</div>

            <div className={classes.footer}>{renderItem(logInOut)}</div>
        </nav>
    )
}
