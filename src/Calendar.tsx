import { Fragment, ReactElement, useState } from "react"
import { Navigate } from "react-router-dom"
import { Group, Modal } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { addWeeks, previousMonday, addYears, differenceInWeeks, isPast, isMonday } from "date-fns"

import { UserProfile, Entry, useUserStore, ProfileStatus } from "./user"
import "./static/calendar.css"
import { EntryForm } from "./EntryForm"

export type EntryInfo = {
    date: string
    entry: Entry | null
}

export function Calendar() {
    const { userAuth, userProfile, entries, profileStatus } = useUserStore()
    const [selectedEntry, setSelectedEntry] = useState<EntryInfo | null>(null)
    const [opened, { open, close }] = useDisclosure(false)

    const generateEntries = (user: UserProfile, entries: Entry[]): EntryInfo[] => {
        const birth = new Date(user.birth)
        const startDate = isMonday(birth) ? birth : previousMonday(birth)
        const endDate = addYears(startDate, user.expYears)
        const numWeeks = differenceInWeeks(endDate, startDate, { roundingMethod: "ceil" })
        const entryDatesArray = [...Array(numWeeks).keys()]
        const entryDates = new Map(entryDatesArray.map(wk => [addWeeks(startDate, wk).toISOString(), null]))
        const entriesMap: Map<string, Entry | null> = entries.reduce((a, v) => ({ ...a, [new Date(v.start).toISOString()]: v }), entryDates)
        const allEntries: EntryInfo[] = []
        entriesMap.forEach((entry, date) => {
            allEntries.push({ date: date, entry: entry })
        })
        return allEntries
    }

    const renderCalEntry = (entryInfo: EntryInfo): ReactElement => {
        const { date, entry } = entryInfo
        const divClass = isPast(date) ? ((entry !== null) ? "entry filled" : "entry past") : "entry future"
        const onClick = isPast(date) ? () => { setSelectedEntry(entryInfo); open() } : undefined
        return <div key={date} className={divClass} onClick={onClick}></div>
    }

    if (profileStatus !== ProfileStatus.CompleteProfile) {
        return <Navigate to="/dashboard/profile" />
    }
    if (userProfile && userAuth && entries) {
        const allEntries = generateEntries(userProfile, entries)
        console.log(`Rendering calendar with ${allEntries.length} entries`)
        return <>
        <Modal opened={opened} onClose={() => { close(); setSelectedEntry(null); }} title="Entry">
            {selectedEntry ? <EntryForm entryInfo={selectedEntry} /> : null}
        </Modal>
            <Fragment>
                <Group maw={1000} pl={10} gap="xs" align="right">
                    {allEntries.map(entry => renderCalEntry(entry))}
                </Group >
            </Fragment>
        </>
    } else {
        console.log(userProfile, userAuth)
    }
}