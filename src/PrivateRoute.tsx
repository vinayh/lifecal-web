import { SetStateAction, useState, Dispatch } from "react"
import { ReactNode, useEffect } from "react"
import { Route, Navigate } from "react-router-dom"
import { User as AuthUser } from "firebase/auth"

import { UserProfile } from "./UserProfile"
import { User, UserZ, InitialUserZ, Status, fetchUser } from "./user"

export default function PrivateRoute({ authUser, user, setUser, children }: { authUser: AuthUser | null | undefined, user: User | null, setUser: Dispatch<SetStateAction<User | null>>, children: ReactNode }) {
    const [loadUserStatus, setLoadUserStatus] = useState<Status>(Status.Loading)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    console.log("PrivateRoute: authUser is ", authUser)
    if (authUser == null) { return <Navigate to="/login" /> }

    useEffect(() => {
        if (user == null) {
            setLoadUserStatus(Status.Loading)
            fetchUser(authUser)
            .then(res => {
                setLoadUserStatus(res.status)
                if (res.status === Status.Success) { setUser(res.user) }
                else { setErrorMessage(res.message) }
            })
        }
    }, [authUser])

    if (loadUserStatus === Status.Loading) {
        return <p>Loading user data...</p>
    } else if (loadUserStatus === Status.Success) {
        const result = UserZ.safeParse(user)
        if (result.success) { return children }
        else { return <UserProfile user={InitialUserZ.parse(user) as User} /> }
    } else if (loadUserStatus === Status.Error) {
        return <p>Cannot load user. {errorMessage}</p>
    }
}