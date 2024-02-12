import { ReactElement } from "react"
import { Grid, Tooltip } from "@mantine/core"
import { addWeeks, previousMonday, addYears, differenceInWeeks, isPast, isMonday } from "date-fns"

import { User, Entry, UserStatus, ProfileStatus } from "./user"
import { useAwaitedUser, useUser } from "./useUser"
import "./static/style.css"
import usePromise from "react-promise-suspense"

const generateEntries = (user: User): Map<Date, Entry | null> => {
    const startDate = isMonday(user.birth) ? user.birth : previousMonday(user.birth)
    const endDate = addYears(startDate, user.expYears)
    const numWeeks = differenceInWeeks(endDate, startDate, { roundingMethod: "ceil" })
    const entryDatesArray = [...Array(numWeeks).keys()]
    const entryDates = new Map(entryDatesArray.map(wk => [addWeeks(startDate, wk), null]))
    const entries: Map<Date, Entry | null> = user.entries.reduce((a, v) => ({ ...a, [v.start.getDate()]: v }), entryDates)
    return entries
}

const renderEntry = (date: Date, entry: Entry | null): ReactElement => {
    const divClass = (isPast(date)) ? ((entry !== null) ? "entry filled" : "entry past") : "entry future"
    return (
        <Tooltip key={date.toDateString()} label={date.toDateString()}>
            <div className={divClass}></div>
        </Tooltip>
    )
}

export function Calendar() {
    const { user, userStatus, profileStatus } = usePromise(useAwaitedUser, [])
    if (user !== null && userStatus === UserStatus.SignedIn && profileStatus === ProfileStatus.CompleteProfile) {
        const entries = generateEntries(user)
        console.log(entries)
        const toRender: Array<ReactElement> = []
        entries.forEach((entry, date) => {
            toRender.push(renderEntry(date, entry))
        })
    
        return <>
            <p>Date of birth: {user.birth.toDateString()}</p>
            <p>{user.name}, {user.email}</p>
            <Grid>
                {toRender}
            </Grid >
        </>
    }
}