import { Fragment, ReactElement, useState } from "react"
import { Navigate } from "react-router-dom"
import { Box, Container, Group, Modal, Title } from "@mantine/core"
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
        entries: Entry[]
    ): EntryInfo[] => {
        const birth = new Date(user.birth)
        const startDate = isMonday(birth) ? birth : previousMonday(birth)
        const endDate = addYears(startDate, user.expYears)
        const numWeeks = differenceInWeeks(endDate, startDate, {
            roundingMethod: "ceil",
        })
        const entryDatesArray = [...Array(numWeeks).keys()]
        const entryDates = new Map(
            entryDatesArray.map(wk => [
                formatISO(addWeeks(startDate, wk), { representation: "date" }),
                null,
            ])
        )
        const entriesMap: Map<string, Entry | null> = entries.reduce(
            (a, v) => ({
                ...a,
                [formatISO(v.start, { representation: "date" })]: v,
            }),
            entryDates
        )
        const allEntries: EntryInfo[] = []
        entriesMap.forEach((entry, date) => {
            allEntries.push({ date: date, entry: entry })
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
                    title="Entry"
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
