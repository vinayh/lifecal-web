import { z } from "zod"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@mantine/hooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from "firebase/auth"

import { auth, LoadStatus, AuthMethod, UserStatus, User, UserZ, InitialUserZ, ProfileFormEntry, ProfileStatus } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

interface UserContextType {
    user: User | null
    authUser: AuthUser | null
    userStatus: UserStatus
    profileStatus: ProfileStatus
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<{ status: LoadStatus, message: string }>
    updateUser: () => Promise<User | null>
    userHasCompleteProfile: () => boolean
    userHasInitialProfile: () => boolean
    userDataStale: () => boolean
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }) => {
    const [authUser, setAuthUserRaw] = useLocalStorage<AuthUser | null>({ key: "authUser", defaultValue: null })
    const [user, setUserRaw] = useLocalStorage<User | null>({ key: "user", defaultValue: null })
    const [userStatus, setUserStatus] = useLocalStorage({ key: "userStatus", defaultValue: UserStatus.NoUser })
    const [profileStatus, setProfileStatus] = useLocalStorage({ key: "profileStatus", defaultValue: ProfileStatus.NoProfile })
    const navigate = useNavigate()
    const [userLastUpdated, setUserLastUpdated] = useState<number | null>(null)

    const setUser = (user: User | null) => {
        if (!user) {
            setUserRaw(null)
            setProfileStatus(ProfileStatus.NoProfile)
            return
        }
        const result = UserZ.safeParse(user)
        if (result.success) {
            setUserRaw(result.data)
            setProfileStatus(ProfileStatus.CompleteProfile)
        } else {
            const initResult = InitialUserZ.safeParse(user)
            if (initResult.success) {
                setUserRaw(initResult.data as User)
                setProfileStatus(ProfileStatus.IncompleteProfile)
            } else {
                setUserRaw(null)
                setProfileStatus(ProfileStatus.InvalidProfile)
            }
        }
    }

    const setAuthUser = (authUser: AuthUser | null) => {
        if (!authUser) {
            setAuthUserRaw(null)
            setUserStatus(UserStatus.NoUser)
        } else {
            setAuthUserRaw(authUser)
            setUserStatus(UserStatus.SignedIn)
        }
    }

    const userHasCompleteProfile = () => {
        return UserZ.safeParse(user).success
    }

    const userHasInitialProfile = () => {
        return InitialUserZ.safeParse(user).success
    }

    const fetchUser = async (authUser: AuthUser | null | undefined): Promise<{ status: LoadStatus, message: string } | { status: LoadStatus, user: User }> => {
        if (!authUser) {
            return Promise.reject({ status: LoadStatus.Error, message: "No user session" })
        }
        console.log(`authUser: ${authUser}`)
        return authUser.getIdToken(false)
            .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${authUser.uid}&idToken=${idToken}`))
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => { throw new Error("Server error, response: " + text) })
                }
                return res.json()
                    .then(user => {
                        if (user.created) { user.created = new Date(user.created) }
                        if (user.birth) { user.birth = new Date(user.birth) }
                        return { status: LoadStatus.Success, user: user as User }
                    })
            })
            .catch(error => { return Promise.reject({ status: LoadStatus.Error, message: "Error parsing user: " + error.message }) })
    }

    const updateProfile = async (formEntry: ProfileFormEntry): Promise<{ status: LoadStatus, message: string }> => {
        const oldProfileStatus = profileStatus
        setProfileStatus(ProfileStatus.UpdatingProfile)

        const { name, birth, expYears, email } = formEntry
        console.log(new Date(birth))
        if (authUser !== null && (profileStatus == ProfileStatus.CompleteProfile || profileStatus == ProfileStatus.IncompleteProfile)) {
            return authUser.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${authUser.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (res.ok) {
                        setProfileStatus(ProfileStatus.CompleteProfile)
                        return { status: LoadStatus.Success, message: "Profile updated." }
                    }
                    else {
                        setProfileStatus(oldProfileStatus)
                        return { status: LoadStatus.Error, message: "Server error." }
                    }
                })
                .catch(() => {
                    setProfileStatus(oldProfileStatus)
                    return { status: LoadStatus.Error, message: "Error updating profile." }
                })
        } else {
            setProfileStatus(oldProfileStatus)
            return Promise.reject({ status: LoadStatus.Error, message: "Invalid user session" })
        }
    }

    const login = async (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => {
        setUserStatus(UserStatus.SigningIn)
        var authCred: UserCredential
        try {
            if (authMethod === "emailPassword" && data) {
                console.log(`Signing in with ${data.email}, ${data.password}`)
                authCred = await signInWithEmailAndPassword(auth, data.email, data.password)
                    .catch(_ => createUserWithEmailAndPassword(auth, data.email, data.password))
                console.log(`Signed in, authCred: ${authCred}`)
            } else if (authMethod === "github") {
                authCred = await signInWithPopup(auth, new GithubAuthProvider().addScope("read:user"))
            } else if (authMethod === "google") {
                authCred = await signInWithPopup(auth, new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile"))
            } else {
                throw new Error("Invalid auth method specified")
            }
        } catch (error) {
            console.log("Error signing in!")
            setAuthUser(null)
            throw error
        }
        setAuthUser(authCred.user)
        navigate("/dashboard/profile")
    }

    const logout = () => {
        signOut(auth)
            .then(() => {
                navigate("/", { replace: true })
                setUser(null)
                setAuthUser(null)
                console.log("Signed out successfully")
            })
            .catch(error => { console.log("Error signing out: ", error) })
    }

    const updateUser = async (userToUpdate: AuthUser | null = authUser): Promise<User | null> => {
        if (profileStatus !== ProfileStatus.LoadingProfile && userToUpdate && userDataStale()) {
            setProfileStatus(ProfileStatus.LoadingProfile)
            console.log(`Updating user data... userToUpdate is null? ${!userToUpdate}, user is null? ${!user}, last updated is null? ${!userLastUpdated}`)
            return fetchUser(userToUpdate)
                .then(res => {
                    console.log(res.status, res.message)
                    const user = (res.status === LoadStatus.Success) ? res.user : null
                    setUser(user)
                    setUserLastUpdated(Date.now())
                    console.log("Updated user data")
                    return user
                })
        }
        return Promise.reject(null)
    }

    useEffect(() => auth.onAuthStateChanged(newAuthUser => updateUser(newAuthUser)), [authUser])

    const userDataStale = () => { return (!user || !userLastUpdated || (Date.now() - userLastUpdated) > 120000) }

    const value = useMemo(() => ({ user, authUser, userStatus, profileStatus, login, logout, updateProfile, updateUser, userHasCompleteProfile, userHasInitialProfile, userDataStale }), [user])
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const userContext = useContext(UserContext)
    if (!userContext) { throw new Error("No AuthContext provider found") }
    return userContext
}

export const useAwaitedUser = async (): Promise<UserContextType> => {
    const userContext = useContext(UserContext)
    if (!userContext) { throw new Error("No AuthContext provider found") }
    if (userContext.authUser && userContext.userDataStale()) {
        console.log("Awaiting user...")
        return userContext.updateUser()
            .then(() => userContext)
    }
    return Promise.resolve(userContext)
}