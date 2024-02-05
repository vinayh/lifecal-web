import { z } from "zod"
import { Dispatch, SetStateAction } from "react"
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, AuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import "firebaseui/dist/firebaseui.css"
import { User as AuthUser } from "firebase/auth"

import { app } from "./firebase"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
export const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

const providers: { [index: string]: AuthProvider } = {
    github: new GithubAuthProvider().addScope("read:user"),
    google: new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile")
}

export enum Status {
    Loading,
    Success,
    Error
}

export const auth = getAuth(app)

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const TagZ = z.object({
    id: z.number(), created: z.date(), name: z.string(), color: z.string(),
});
export type Tag = z.infer<typeof TagZ>


export const EntryZ = z.object({
    id: z.number(), created: z.date(), start: z.date(), note: z.string(), tags: z.array(TagZ),
});
export type Entry = z.infer<typeof EntryZ>


export const UserZ = z.object({
    uid: z.string(), created: z.coerce.date(), name: z.string(), birth: z.coerce.date(), expYears: z.number(), email: z.string().email(), entries: z.array(EntryZ), tags: z.array(TagZ),
});
export type User = z.infer<typeof UserZ>

export const InitialUserZ = UserZ.partial({ name: true, birth: true, expYears: true, email: true })

export const authProvider = async (providerName: string) => {
    if (!(providerName in providers)) { throw Error }
    const user = await signInWithPopup(auth, providers[providerName])
        .then(res => res.user)
    console.log(user)
}

export const authEmailPassword = async (e: z.infer<typeof LoginFormEntryZ>, setLoggingIn: Dispatch<SetStateAction<boolean>>) => {
    setLoggingIn(true)
    const { email, password } = LoginFormEntryZ.parse(e)
    signInWithEmailAndPassword(auth, email, password)
        .catch(_ => createUserWithEmailAndPassword(auth, email, password))
        .then(_ => setLoggingIn(false))
        .catch(error => {
            setLoggingIn(false)
            console.log("Error logging in: ", error.message)
        })
}

export async function fetchUser(authUser: AuthUser | null | undefined): Promise<{ status: Status, message: string } | { status: Status, user: User }> {
    if (authUser == null) {
        return { status: Status.Error, message: "No user session" }
    }
    const res = await authUser.getIdToken(false)
        .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${authUser.uid}&idToken=${idToken}`))
    if (res.ok) {
        return res.json()
            .then(fetched => {
                const user = {
                    ...fetched,
                    created: (fetched.created !== null) ? new Date(fetched.created) : null,
                    birth: (fetched.birth !== null) ? new Date(fetched.birth) : null,
                }
                return { status: Status.Success, user: user as User }
            })
            .catch(error => { return { status: Status.Error, message: "Error parsing user: " + error.message } })
    } else {
        return res.text()
            .then(text => { return { status: Status.Error, message: "Server error, response: " + text } })
    }
}

export type ProfileFormEntry = { name: string, birth: string | Date, expYears: string | number, email: string }

export async function updateUserProfile(authUser: AuthUser, formEntry: ProfileFormEntry) {
    const { name, birth, expYears, email } = formEntry
    console.log(new Date(birth))
    return authUser.getIdToken()
        .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${authUser.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
        .then(res => {
            if (res.ok) { return { status: Status.Success, message: "Profile updated." } }
            else { return { status: Status.Error, message: "Server error." } }
        })
        .catch(_ => { return { status: Status.Error, message: "Error updating profile." } })
}

export async function fetchUserOuter(authUser: AuthUser | null | undefined,
    setLoadUserStatus: Dispatch<SetStateAction<Status>>,
    setUser: Dispatch<SetStateAction<User | undefined>>,
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>) {
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