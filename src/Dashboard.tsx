import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "./auth"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

export default function Dashboard(props) {
    const [user, loading, error] = useAuthState(auth)
    if (loading || error || !user) { return }
    const fetchedUser = user.getIdToken(true)
        .then(idToken => fetch(`${BACKEND_URL}/getUser?idToken=${idToken}`))
        .then(res => res.json())
        .then(res => {
            if (!res.ok) { console.log("User not fetched", res) }
            return res
        })
        .catch(error => console.log("Error", error))
    return <>123</>
}