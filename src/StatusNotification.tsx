import { IconX, IconCheck } from "@tabler/icons-react"
import { Notification, Loader, rem } from "@mantine/core"

import { Status } from "./user"

const IconError = <IconX style={{ width: rem(20), height: rem(20) }} />
const IconSuccess = <IconCheck style={{ width: rem(20), height: rem(20) }} />

export function StatusNotification({ status, message }: { status: Status | null, message: string | null }) {
    if (status === null) {
        return
    }
    else if (status === Status.Error) {
        return (
            <Notification icon={IconError} withCloseButton={false} color="red" title="Error">
                {message}
            </Notification>
        )
    }
    else if (status === Status.Loading) {
        return (
            <Notification loading={true} withCloseButton={false} title="Updating">
                {message}
            </Notification>
        )
    } else if (status === Status.Success) {
        return (
            <Notification icon={IconSuccess} withCloseButton={false} title="Success">
                {message}
            </Notification>
        )
    }
}