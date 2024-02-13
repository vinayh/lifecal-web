import { z } from "zod"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@uidotdev/usehooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from "firebase/auth"

import { auth, LoadStatus, AuthMethod, AuthStatus, UserProfile, UserProfileZ, InitialUserZ, ProfileFormEntry, ProfileStatus } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

interface UserContextType {
    userProfile: UserProfile | null
    userAuth: AuthUser | null
    userStatus: AuthStatus
    profileStatus: ProfileStatus
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<{ status: LoadStatus, message: string }>
    loadProfile: () => Promise<UserProfile | null>
    profileIsStale: () => boolean
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }) => {
    const [userAuth, setUserAuthHelper] = useState<AuthUser | null>(null)
    const [userProfile, setUserProfileHelper] = useLocalStorage<UserProfile | null>("userProfile", null)
    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.NoUser)
    const [profileStatus, setProfileStatus] = useState<ProfileStatus>(ProfileStatus.NoProfile)
    const [userLastUpdated, setUserLastUpdated] = useLocalStorage<number | null>("userLastUpdated", null)
    const navigate = useNavigate()

    const setUserProfile = (profile: UserProfile | null) => {
        if (!profile) {
            console.log("Setting null profile")
            setUserProfileHelper(null)
            setProfileStatus(ProfileStatus.NoProfile)
        } else {
            const result = UserProfileZ.safeParse(profile)
            if (result.success) {
                console.log("Setting complete profile to: " + JSON.stringify(result.data))
                setUserProfileHelper(result.data)
                setProfileStatus(ProfileStatus.CompleteProfile)
                console.log("userProfile: " + JSON.stringify(userProfile))
            } else {
                const initResult = InitialUserZ.safeParse(profile)
                if (initResult.success) {
                    console.log("Setting initial incomplete profile")
                    setUserProfileHelper(initResult.data as UserProfile)
                    setProfileStatus(ProfileStatus.IncompleteProfile)
                } else {
                    console.log("Setting invalid/null profile")
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
        console.log(`Updating profile with birth: ${birth}, userAuth: ${userAuth}, profileStatus: ${profileStatus}`)
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

    const loadProfile = async (userToLoad: AuthUser | null = userAuth): Promise<UserProfile | null> => {
        if (profileStatus === ProfileStatus.LoadingProfile || profileStatus === ProfileStatus.InvalidProfile || !userToLoad || !profileIsStale) {
            console.log("Not loading profile due to currently loading, invalid profile, or existing updated user data")
            return Promise.resolve(null)
        }
        setProfileStatus(ProfileStatus.LoadingProfile)
        console.log(`Loading user profile. --- userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
        const res = await userToLoad.getIdToken(true)
            .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${userToLoad.uid}&idToken=${idToken}`))
        if (!res.ok) {
            setUserProfile(null)
            return res.text()
                .then(text => { return Promise.reject("Server error, response: " + text) })
                .catch(error => { return Promise.reject("Error parsing server error response: " + error.message) })
        } else {
            return res.json()
                .then(profile => {
                    if (profile.created) { profile.created = new Date(profile.created) }
                    if (profile.birth) { profile.birth = new Date(profile.birth) }
                    console.log("Fetched profile:" + profile.created + profile.birth)
                    setUserProfile(profile)
                    setUserLastUpdated(Date.now())
                    console.log(`Updated profile! --- userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
                    return profile
                })
                .catch(error => {
                    setUserProfile(null)
                    return Promise.reject("Error parsing user: " + error.message)
                })
        }
    }

    const profileIsStale = () => { return (!userProfile || !userLastUpdated || !userAuth || (Date.now() - userLastUpdated) > 120000) }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async newUserAuth => {
            // TODO: This fn is called when Firebase auth gets its auth cred stored in local storage and finishes getting/refreshing the auth user obj
            // Should add some sort of callback/promise so `useAwaitedUser` waits until this is loaded on page refresh

            // setAuthStatus(AuthStatus.SigningIn)
            console.log(`Auth state change, newUserAuth: ${JSON.stringify(newUserAuth)}`)
            setUserAuth(newUserAuth)
            if (!userProfile || !newUserAuth || userProfile.uid !== newUserAuth.uid) {
                await loadProfile(newUserAuth)
            }
            // setAuthStatus(AuthStatus.SignedIn)
            return () => unsubscribe()
        })
    }, [])

    const value = useMemo(() => ({ userProfile: userProfile, userAuth: userAuth, userStatus: authStatus, profileStatus, login, logout, updateProfile, loadProfile: loadProfile, profileIsStale: profileIsStale }), [userProfile])
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const userContext = useContext(UserContext)
    if (!userContext) { throw new Error("No AuthContext provider found") }
    return userContext
}

export const useAwaitedUser = async (): Promise<UserContextType> => {
    const userContext = useContext(UserContext)
    if (!userContext) { return Promise.reject("No AuthContext provider found") }
    if (!userContext.userAuth) { return Promise.reject("No user session") }
    if (!userContext.profileIsStale()) { return Promise.resolve(userContext) }
    console.log("Awaiting user...")
    await userContext.loadProfile()
    return userContext
}