import { Fragment, ReactElement } from "react"
import { Grid, Tooltip } from "@mantine/core"
import { addWeeks, previousMonday, addYears, differenceInWeeks, isPast, isMonday } from "date-fns"

import { UserProfile, Entry, AuthStatus, ProfileStatus } from "./user"
import { useAwaitedUser, useUser } from "./useUser"
import "./static/style.css"
import usePromise from "react-promise-suspense"

const generateEntries = (user: UserProfile): Map<string, Entry | null> => {
    const birth = new Date(user.birth)
    const startDate = isMonday(birth) ? birth : previousMonday(birth)
    const endDate = addYears(startDate, user.expYears)
    const numWeeks = differenceInWeeks(endDate, startDate, { roundingMethod: "ceil" })
    const entryDatesArray = [...Array(numWeeks).keys()]
    const entryDates = new Map(entryDatesArray.map(wk => [addWeeks(startDate, wk).toISOString(), null]))
    const entries: Map<string, Entry | null> = user.entries.reduce((a, v) => ({ ...a, [new Date(v.start).toISOString()]: v }), entryDates)
    // TODO: .getDate() above likely isn't correct
    return entries
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
    const { profileStatus, authStatus, userAuth, userProfile } = useUser()
    // const [{ profileStatus, authStatus }, userAuth, userProfile] = usePromise(useAwaitedUser, [])

    if (userProfile && userAuth) {
        const entries = generateEntries(userProfile)
        console.log(entries)
        const toRender: Array<ReactElement> = []
        entries.forEach((entry, date) => {
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