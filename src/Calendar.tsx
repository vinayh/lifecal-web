import { Fragment, ReactElement } from "react"
import { Grid, Tooltip } from "@mantine/core"
import { addWeeks, previousMonday, addYears, differenceInWeeks, isPast, isMonday } from "date-fns"

import { UserProfile, Entry, useUserStore } from "./user"
import { useUser } from "./useUser"
import "./static/style.css"

const generateEntries = (user: UserProfile, entries: Entry[]): Map<string, Entry | null> => {
    const birth = new Date(user.birth)
    const startDate = isMonday(birth) ? birth : previousMonday(birth)
    const endDate = addYears(startDate, user.expYears)
    const numWeeks = differenceInWeeks(endDate, startDate, { roundingMethod: "ceil" })
    const entryDatesArray = [...Array(numWeeks).keys()]
    const entryDates = new Map(entryDatesArray.map(wk => [addWeeks(startDate, wk).toISOString(), null]))
    const allEntries: Map<string, Entry | null> = entries.reduce((a, v) => ({ ...a, [new Date(v.start).toISOString()]: v }), entryDates)
    // TODO: .getDate() above likely isn't correct
    return allEntries
}

const renderEntry = (date: string, entry: Entry | null): ReactElement => {
    const divClass = (isPast(date)) ? ((entry !== null) ? "entry filled" : "entry past") : "entry future"
    return (
        // <Tooltip key={date} label={date}>
            <div key={date} className={divClass}></div>
        // </Tooltip>
    )
}

export function Calendar() {
    const { userAuth, userProfile, entries } = useUserStore()
    // const [{ profileStatus, authStatus }, userAuth, userProfile] = usePromise(useAwaitedUser, [])

    if (userProfile && userAuth) {
        const allEntries = generateEntries(userProfile, entries)
        console.log(allEntries)
        const toRender: Array<ReactElement> = []
        allEntries.forEach((entry, date) => {
            toRender.push(renderEntry(date, entry))
        })
        console.log(`Rendering calendar with ${toRender.length} entries`)
        return <>
            <p>Date of birth: {userProfile.birth}</p>
            <p>{userProfile.name}, {userProfile.email}</p>
            <Grid>
                <Fragment>
                    {toRender}
                </Fragment>
            </Grid >
        </>
    } else {
        console.log(userProfile, userAuth)
        // return <p>{JSON.stringify(userProfile)} <br></br> Auth: {JSON.stringify(userAuth)} <br></br> authStatus: {authStatus}, Profile: {profileStatus.current}</p>
    }
}