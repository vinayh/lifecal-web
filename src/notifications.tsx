import { rem } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons-react"

export const newLoading = (title: string, message: string) =>
    notifications.show({
        loading: true,
        title: title,
        message: message,
        autoClose: false,
        withCloseButton: false,
    })

export const updateSuccess = (id: string, title: string, message: string) =>
    notifications.update({
        id,
        color: "teal",
        title: title,
        message: message,
        icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
        loading: false,
        autoClose: 3000,
    })

export const updateError = (id: string, title: string, message: string) =>
    notifications.update({
        id,
        color: "red",
        title: title,
        message: message,
        icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
        loading: false,
        autoClose: 3000,
    })
