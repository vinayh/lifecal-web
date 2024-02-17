import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, fetchUser, UserProfileZ, UserProfile, FetchStatus, InitialUserZ } from "./user"
import { UserProfile } from "./UserProfile";
import { Calendar } from "./Calendar"

export function Dashboard(props) {
    const [authUser, authLoading, authError] = useAuthState(auth)
    const [loadUserStatus, setLoadUserStatus] = useState<FetchStatus>(FetchStatus.Loading)
    const [user, setUser] = useState<UserProfile | undefined>()
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    useEffect(() => {
        fetchUser(authUser, setLoadUserStatus, setUser, setErrorMessage)
    }, [authUser])

    if (loadUserStatus === FetchStatus.Loading) {
        return <p>Loading user data...</p>
    } else if (loadUserStatus === FetchStatus.Success) {
        const result = UserProfileZ.safeParse(user)
        if (result.success) { return <Calendar user={result.data} /> }
        else { return <UserProfile user={InitialUserZ.parse(user) as UserProfile} /> }
    } else if (loadUserStatus === FetchStatus.Error) {
        return <p>Cannot load user. {errorMessage}</p>
    }
}