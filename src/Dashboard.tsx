import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, fetchUser, UserZ, User, Status, InitialUserZ } from "./user"
import { UserProfile } from "./UserProfile";
import { Calendar } from "./Calendar"

export function Dashboard(props) {
    const [authUser, authLoading, authError] = useAuthState(auth)
    const [loadUserStatus, setLoadUserStatus] = useState<Status>(Status.Loading)
    const [user, setUser] = useState<User | undefined>()
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    useEffect(() => {
        fetchUser(authUser, setLoadUserStatus, setUser, setErrorMessage)
    }, [authUser])

    if (loadUserStatus === Status.Loading) {
        return <p>Loading user data...</p>
    } else if (loadUserStatus === Status.Success) {
        const result = UserZ.safeParse(user)
        if (result.success) { return <Calendar user={result.data} /> }
        else { return <UserProfile user={InitialUserZ.parse(user) as User} /> }
    } else if (loadUserStatus === Status.Error) {
        return <p>Cannot load user. {errorMessage}</p>
    }
}