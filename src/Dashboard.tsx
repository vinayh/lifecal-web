import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, UserZ, User, Status, InitialUserZ } from "./user"
import { UserProfile } from "./UserProfile";
import { Calendar } from "./Calendar"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
export const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

export function Dashboard(props) {
    const [authUser, authLoading, authError] = useAuthState(auth)
    const [loadUserStatus, setLoadUserStatus] = useState<Status>(Status.Loading)
    const [user, setUser] = useState<User | undefined>()
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    useEffect(() => {
        async function fetchUser() {
            if (authUser == null) {
                setLoadUserStatus(Status.Error)
                return
            }
            const res = await authUser.getIdToken(false)
                .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${authUser.uid}&idToken=${idToken}`))
            if (res.ok) {
                res.json()
                    .then(fetched => {
                        return {
                            ...fetched,
                            created: (fetched.created !== null) ? new Date(fetched.created) : null,
                            birth: (fetched.birth !== null) ? new Date(fetched.birth) : null,
                        }
                    })
                    .then(user => {
                        setUser(user)
                        setLoadUserStatus(Status.Success)
                    })
                    .catch(error => {
                        setLoadUserStatus(Status.Error)
                        setErrorMessage("Error parsing user: " + error.message)
                    })
            } else {
                res.text()
                    .then(text => {
                        setLoadUserStatus(Status.Error)
                        setErrorMessage("Server error, response: " + text)
                    })
            }
        }
        fetchUser()
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