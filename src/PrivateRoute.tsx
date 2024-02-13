import { SetStateAction, useState, Dispatch } from "react"
import { ReactNode, useEffect } from "react"
import { Route, Navigate } from "react-router-dom"
import { User as AuthUser } from "firebase/auth"

import { UserProfile } from "./UserProfile"
import { UserProfile, UserProfileZ, InitialUserZ, LoadStatus, fetchUser } from "./user"

export default function PrivateRoute({ authUser, authLoading, user, setUser, children }: { authUser: AuthUser | null | undefined, authLoading: boolean, user: UserProfile | null, setUser: Dispatch<SetStateAction<UserProfile | null>>, children: ReactNode }) {
    const [loadUserStatus, setLoadUserStatus] = useState<LoadStatus>(LoadStatus.Loading)
    
    console.log(`PrivateRoute - loading: ${authLoading}, authUser:`, authUser)
    if (authUser == null && authLoading == false) { return <Navigate to="/login" replace /> }

    if (loadUserStatus === LoadStatus.Loading) {
        return <p>Loading user data...</p>
    } else if (loadUserStatus === LoadStatus.Success) {
        if (UserProfileZ.safeParse(user).success) {
            return children
        }
        else {
            const initResult = InitialUserZ.safeParse(user)
            // if (initResult.success) { return <Navigate to="/profile" /> }
            if (initResult.success) { return <UserProfile user={initResult.data as UserProfile} authUser={authUser} /> }
            else {
                console.log(user)
                return <p>Invalid user data, Zod error: {initResult.error.toString()}</p>
            }
        }
    } else if (loadUserStatus === LoadStatus.Error) {
        return <p>Cannot load user. {errorMessage}</p>
    }
}