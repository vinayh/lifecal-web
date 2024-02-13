import { z } from "zod"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@mantine/hooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from "firebase/auth"

import { auth, LoadStatus, AuthMethod, AuthStatus, User, UserZ, InitialUserZ, ProfileFormEntry, ProfileStatus } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

interface UserContextType {
    user: User | null
    authUser: AuthUser | null
    userStatus: AuthStatus
    profileStatus: ProfileStatus
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<{ status: LoadStatus, message: string }>
    loadProfile: () => Promise<User | null>
    profileIsStale: () => boolean
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }) => {
    const [userAuth, setUserAuthHelper] = useLocalStorage<AuthUser | null>({ key: "userAuth", defaultValue: null })
    const [userProfile, setUserProfileHelper] = useLocalStorage<User | null>({ key: "userProfile", defaultValue: null })
    const [authStatus, setAuthStatus] = useLocalStorage<AuthStatus>({ key: "authStatus", defaultValue: AuthStatus.NoUser })
    const [profileStatus, setProfileStatus] = useLocalStorage<ProfileStatus>({ key: "profileStatus", defaultValue: ProfileStatus.NoProfile })
    const [userLastUpdated, setUserLastUpdated] = useLocalStorage<number | null>({ key: "userLastUpdated", defaultValue: null })
    const navigate = useNavigate()

    const setUserProfile = (user: User | null) => {
        if (!user) {
            setUserProfileHelper(null)
            setProfileStatus(ProfileStatus.NoProfile)
        } else {
            const result = UserZ.safeParse(user)
            if (result.success) {
                setUserProfileHelper(result.data)
                setProfileStatus(ProfileStatus.CompleteProfile)
            } else {
                const initResult = InitialUserZ.safeParse(user)
                if (initResult.success) {
                    setUserProfileHelper(initResult.data as User)
                    setProfileStatus(ProfileStatus.IncompleteProfile)
                } else {
                    setUserProfileHelper(null)
                    setProfileStatus(ProfileStatus.InvalidProfile)
                }
            }
        }
    }

    const setUserAuth = (authUser: AuthUser | null) => {
        if (!authUser) {
            setUserAuthHelper(null)
            setUserProfile(null)
            setAuthStatus(AuthStatus.NoUser)
        } else {
            setUserAuthHelper(authUser)
            setAuthStatus(AuthStatus.SignedIn)
        }
    }

    const updateProfile = async (formEntry: ProfileFormEntry): Promise<{ status: LoadStatus, message: string }> => {
        const oldProfileStatus = profileStatus
        setProfileStatus(ProfileStatus.UpdatingProfile)

        const { name, birth, expYears, email } = formEntry
        console.log(new Date(birth))
        if (userAuth !== null && (profileStatus == ProfileStatus.CompleteProfile || profileStatus == ProfileStatus.IncompleteProfile)) {
            return userAuth.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${userAuth.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
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
        setAuthStatus(AuthStatus.SigningIn)
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
            setUserAuth(null)
            throw error
        }
        setUserAuth(authCred.user)
        navigate("/dashboard/profile")
    }

    const logout = () => {
        signOut(auth)
            .then(() => {
                navigate("/", { replace: true })
                setUserProfile(null)
                setUserAuth(null)
                console.log("Signed out successfully")
            })
            .catch(error => { console.log("Error signing out: ", error) })
    }

    const fetchProfile = async (authUser: AuthUser | null | undefined): Promise<{ status: LoadStatus, message: string } | { status: LoadStatus, user: User }> => {
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

    const loadProfile = async (userToLoad: AuthUser | null = userAuth): Promise<User | null> => {
        if (profileStatus === ProfileStatus.LoadingProfile || profileStatus === ProfileStatus.InvalidProfile || !userToLoad || !profileIsStale) {
            console.log("Not loading profile due to currently loading, invalid profile, or existing updated user data")
            return Promise.resolve(null)
        }
        setProfileStatus(ProfileStatus.LoadingProfile)
        console.log(`Loading user profile... userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
        const res = await userToLoad.getIdToken(true)
            .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${userToLoad.uid}&idToken=${idToken}`))
        if (!res.ok) {
            return res.text()
                .then(text => { return Promise.reject("Server error, response: " + text) })
                .catch(error => { return Promise.reject("Error parsing server error response: " + error.message) })
        } else {
            return res.json()
                .then(user => {
                    if (user.created) { user.created = new Date(user.created) }
                    if (user.birth) { user.birth = new Date(user.birth) }
                    setUserProfile(user)
                    setUserLastUpdated(Date.now())
                    console.log("Updated user data")
                    return user
                })
                .catch(error => { return Promise.reject("Error parsing user: " + error.message) })
        }
    }

    const profileIsStale = () => { return (!userProfile || !userLastUpdated || (Date.now() - userLastUpdated) > 120000) }

    useEffect(() => auth.onAuthStateChanged(newAuthUser => loadProfile(newAuthUser)), [])

    const value = useMemo(() => ({ user: userProfile, authUser: userAuth, userStatus: authStatus, profileStatus, login, logout, updateProfile, loadProfile: loadProfile, profileIsStale: profileIsStale }), [userProfile])
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
    if (userContext.authUser && userContext.profileIsStale()) {
        console.log("Awaiting user...")
        await userContext.loadProfile()
    }
    return Promise.resolve(userContext)
}