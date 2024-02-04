import { IconX, IconCheck } from "@tabler/icons-react"
import { Notification, Loader, rem } from "@mantine/core"

export enum Status {
    Loading,
    Success,
    Error
}

const IconError = <IconX style={{ width: rem(20), height: rem(20) }} />
const IconSuccess = <IconCheck style={{ width: rem(20), height: rem(20) }} />

export function StatusNotification({ status, message }: { status: Status | null, message: string | null }) {
    if (status === null) {
        return
    }
    else if (status === Status.Error) {
        return (
            <Notification icon={IconError} color="red" title="Error">
                {message}
            </Notification>
        )
    }
    else if (status === Status.Loading) {
        return (
            <Notification loading={true} title="Updating">
                {message}
            </Notification>
        )
    } else if (status === Status.Success) {
        return (
            <Notification icon={IconSuccess} title="Success">
                {message}
            </Notification>
        )
    }
}