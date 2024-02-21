import { Fragment, ReactElement, useState } from "react"
import { Navigate } from "react-router-dom"
import { Box, Group, Modal, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
    addWeeks,
    previousMonday,
    addYears,
    differenceInWeeks,
    isPast,
    isMonday,
    formatISO,
} from "date-fns"

import { UserProfile, Entry, useUserStore, ProfileStatus } from "./user"
import { EntryForm } from "./EntryForm"
import "/public/styles/calendar.css"

export type EntryInfo = {
    date: string
    entry: Entry | null
}

export function Calendar() {
    const { userAuth, userProfile, entries, profileStatus } = useUserStore()
    const [selectedEntry, setSelectedEntry] = useState<EntryInfo | null>(null)
    const [opened, { open, close }] = useDisclosure(false)

    const generateEntries = (
        user: UserProfile,
        entries: Record<string, Entry>
    ): EntryInfo[] => {
        const birth = new Date(user.birth)
        const startDate = isMonday(birth) ? birth : previousMonday(birth)
        const endDate = addYears(startDate, user.expYears)
        const numWeeks = differenceInWeeks(endDate, startDate, {
            roundingMethod: "ceil",
        })
        const entryDatesArray = [...Array(numWeeks).keys()]
        const allEntries: EntryInfo[] = entryDatesArray.map(wk => {
            const start = formatISO(addWeeks(startDate, wk), {
                representation: "date",
            })
            return {
                date: start,
                entry: start in entries ? entries[start] : null,
            }
        })
        return allEntries
    }

    const renderCalEntry = (entryInfo: EntryInfo): ReactElement => {
        const { date, entry } = entryInfo
        const divClass = isPast(date)
            ? entry !== null
                ? "entry filled"
                : "entry past"
            : "entry future"
        const onClick = isPast(date)
            ? () => {
                  setSelectedEntry(entryInfo)
                  open()
              }
            : undefined
        return <div key={date} className={divClass} onClick={onClick}></div>
    }

    if (
        userProfile &&
        userAuth &&
        entries &&
        profileStatus === ProfileStatus.CompleteProfile
    ) {
        const allEntries = generateEntries(userProfile, entries)
        console.log(`Rendering calendar with ${allEntries.length} entries`)
        return (
            <>
                <Box maw={700} pt={50} mx="auto">
                    <Title order={2} mb={20}>
                        Your life calendar
                    </Title>
                    <Fragment>
                        <Group gap="xs">{allEntries.map(renderCalEntry)}</Group>
                    </Fragment>
                </Box>
                <Modal
                    opened={opened}
                    onClose={() => {
                        close()
                        setSelectedEntry(null)
                    }}
                    title="Add or edit entry"
                >
                    {selectedEntry ? (
                        <EntryForm entryInfo={selectedEntry} />
                    ) : null}
                </Modal>
            </>
        )
    } else {
        console.log(userProfile, userAuth)
        return <Navigate to="/profile" />
    }
}
