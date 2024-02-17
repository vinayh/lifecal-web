import { Container, Group } from "@mantine/core"
import classes from "./static/header.module.css"
import { useNavigate, useLocation } from "react-router-dom"

import { AuthStatus, useUserStore } from "./user"

const privateLinks = [
    { link: "/", label: "Home" },
    { link: "/dashboard/calendar", label: "Calendar" },
    { link: "/dashboard/profile", label: "Profile" }
]

const publicLinks = [
    { link: "/", label: "Home" },
    { link: "/about", label: "About" }
]

export const Header = () => {
    const { userAuth, authStatus } = useUserStore()
    const navigate = useNavigate()
    const location = useLocation()
    // const [active, setActive] = useState(privateLinks[0].link)

    const links = (userAuth && authStatus !== AuthStatus.NoUser) ? privateLinks : publicLinks    
    const items = links.map((link) => (
        <a
            key={link.label}
            href={link.link}
            className={classes.link}
            data-active={location.pathname === link.link || undefined}
            onClick={(event) => {
                event.preventDefault()
                // setActive(link.link)
                navigate(link.link)
            }}
        >
            {link.label}
        </a>
    ))
    
    return (
        <header className={classes.header}>
            <Container size="md" className={classes.inner}>
                {/* <MantineLogo size={28} /> */}
                <Group gap={5} visibleFrom="xs">
                    {items}
                </Group>
                {/* <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" /> */}
            </Container>
        </header>
    )
}

