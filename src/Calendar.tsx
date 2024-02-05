import { z } from "zod"
import { }
import { addWeeks, previousMonday, addYears, differenceInWeeks, isEqual } from "date-fns"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, User, Entry } from "./user"

const generateEntries = (user: User): Map<Date, Entry | null> => {
    const startDate = previousMonday(user.birth)
    const endDate = addYears(startDate, user.expYears)
    const numWeeks = differenceInWeeks(endDate, startDate, {roundingMethod: "ceil"})
    const entryDatesArray = [...Array(numWeeks).keys()]
    const entryDates = new Map(entryDatesArray.map(wk => [addWeeks(startDate, wk), null]))
    const entries: Map<Date, Entry | null> = user.entries.reduce((a, v) => ({ ...a, [v.start.getDate()]: v}), entryDates)
    console.log(entries)
    return entries
}

export function Calendar({ user }: { user: User }) {
    const entries = generateEntries(user)
    console.log(entries)
    return (
        <p>{user.name}</p>

        // <p>{user.name}, {user.email}</p>
    )
}