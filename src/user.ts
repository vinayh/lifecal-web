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

export enum LoadStatus {
    Loading,
    Success,
    Error
}

export enum UserStatus {
    CompleteProfile,
    IncompleteProfile,
    InvalidProfile,
    LoadingProfile,
    ProfileLoadError,
    SignedIn,
    SignInError,
    SigningIn,
    NoUser
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
    uid: z.string(), created: z.coerce.date(), name: z.string(), birth: z.date(), expYears: z.number(), email: z.string().email(), entries: z.array(EntryZ), tags: z.array(TagZ),
});
export type User = z.infer<typeof UserZ>

export const InitialUserZ = UserZ.partial({ name: true, birth: true, expYears: true, email: true })

export const authProvider = async (providerName: string) => {
    if (!(providerName in providers)) { throw Error }
    await signInWithPopup(auth, providers[providerName])
        .then(res => res.user)
}

export const authEmailPassword = async (e: z.infer<typeof LoginFormEntryZ>) => {
    const { email, password } = LoginFormEntryZ.parse(e)
    await signInWithEmailAndPassword(auth, email, password)
        .catch(_ => createUserWithEmailAndPassword(auth, email, password))
        .catch(error => {
            console.log("Error logging in: ", error.message)
        })
}

export async function fetchUser(authUser: AuthUser | null | undefined): Promise<{ status: LoadStatus, message: string } | { status: LoadStatus, user: User }> {
    if (authUser == null) {
        return { status: LoadStatus.Error, message: "No user session" }
    }
    const res = await authUser.getIdToken(false)
        .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${authUser.uid}&idToken=${idToken}`))
    if (res.ok) {
        return res.json()
            .then(user => {
                if (user.created) { user.created = new Date(user.created) }
                if (user.birth) { user.birth = new Date(user.birth) }
                return { status: LoadStatus.Success, user: user as User }
            })
            .catch(error => { return { status: LoadStatus.Error, message: "Error parsing user: " + error.message } })
    } else {
        return res.text()
            .then(text => { return { status: LoadStatus.Error, message: "Server error, response: " + text } })
    }
}

export type ProfileFormEntry = { name: string, birth: string | Date, expYears: string | number, email: string }

export async function updateUserProfile(authUser: AuthUser, formEntry: ProfileFormEntry) {
    const { name, birth, expYears, email } = formEntry
    console.log(new Date(birth))
    return authUser.getIdToken()
        .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${authUser.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
        .then(res => {
            if (res.ok) { return { status: LoadStatus.Success, message: "Profile updated." } }
            else { return { status: LoadStatus.Error, message: "Server error." } }
        })
        .catch(_ => { return { status: LoadStatus.Error, message: "Error updating profile." } })
}

export async function fetchUserOuter(authUser: AuthUser | null | undefined,
    setLoadUserStatus: Dispatch<SetStateAction<LoadStatus>>,
    setUser: Dispatch<SetStateAction<User | undefined>>,
    setErrorMessage: Dispatch<SetStateAction<string | undefined>>) {
    if (authUser == null) {
        setLoadUserStatus(LoadStatus.Error)
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
                setLoadUserStatus(LoadStatus.Success)
            })
            .catch(error => {
                setLoadUserStatus(LoadStatus.Error)
                setErrorMessage("Error parsing user: " + error.message)
            })
    } else {
        res.text()
            .then(text => {
                setLoadUserStatus(LoadStatus.Error)
                setErrorMessage("Server error, response: " + text)
            })
    }
}