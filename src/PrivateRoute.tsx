import { SetStateAction, useState, Dispatch } from "react"
import { ReactNode, useEffect } from "react"
import { Route, Navigate } from "react-router-dom"
import { User as AuthUser } from "firebase/auth"

import { UserProfile } from "./UserProfile"
import { User, UserZ, InitialUserZ, Status, fetchUser } from "./user"

export default function PrivateRoute({ authUser, authLoading, user, setUser, children }: { authUser: AuthUser | null | undefined, authLoading: boolean, user: User | null, setUser: Dispatch<SetStateAction<User | null>>, children: ReactNode }) {
    const [loadUserStatus, setLoadUserStatus] = useState<Status>(Status.Loading)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    console.log(`PrivateRoute - loading: ${authLoading}, authUser:`, authUser)
    if (authUser == null && authLoading == false) { return <Navigate to="/login" /> }

    useEffect(() => {
        if (user == null) {
            setLoadUserStatus(Status.Loading)
            fetchUser(authUser)
                .then(res => {
                    setLoadUserStatus(res.status)
                    if (res.status === Status.Success) {
                        console.log(res.user)
                        setUser(res.user)
                    }
                    else { setErrorMessage(res.message) }
                })
        }
    }, [authUser])

    if (loadUserStatus === Status.Loading) {
        return <p>Loading user data...</p>
    } else if (loadUserStatus === Status.Success) {
        if (UserZ.safeParse(user).success) {
            return children
        }
        else {
            const initResult = InitialUserZ.safeParse(user)
            // if (initResult.success) { return <Navigate to="/profile" /> }
            if (initResult.success) { return <UserProfile user={initResult.data as User} authUser={authUser} /> }
            else {
                console.log(user)
                return <p>Invalid user data, Zod error: {initResult.error.toString()}</p>
            }
        }
    } else if (loadUserStatus === Status.Error) {
        return <p>Cannot load user. {errorMessage}</p>
    }
}