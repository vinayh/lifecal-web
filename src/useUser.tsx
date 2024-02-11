import { z } from "zod"
import { createContext, useContext, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@mantine/hooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from "firebase/auth"

import { auth, LoadStatus, AuthMethod, UserStatus, User, UserZ, InitialUserZ, ProfileFormEntry, ProfileStatus } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

interface UserContextType {
    user: User | null
    userStatus: UserStatus
    profileStatus: ProfileStatus
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<{ status: LoadStatus, message: string }>
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }) => {
    const [authUser, setAuthUser] = useLocalStorage<AuthUser | null>({ key: "authUser", defaultValue: null })
    const [user, setUserRaw] = useLocalStorage<User | null>({ key: "user", defaultValue: null })
    const [userStatus, setUserStatus] = useLocalStorage({ key: "userStatus", defaultValue: UserStatus.NoUser })
    const [profileStatus, setProfileStatus] = useLocalStorage({ key: "profileStatus", defaultValue: ProfileStatus.NoProfile })
    // const navigate = useNavigate()

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
                setProfileStatus(ProfileStatus.InvalidProfile)
            }
        }
    }

    async function fetchUser(authUser: AuthUser | null | undefined): Promise<{ status: LoadStatus, message: string } | { status: LoadStatus, user: User }> {
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
                authCred = await signInWithEmailAndPassword(auth, data.email, data.password)
                    .catch(_ => createUserWithEmailAndPassword(auth, data.email, data.password))
            } else if (authMethod === "github") {
                authCred = await signInWithPopup(auth, new GithubAuthProvider().addScope("read:user"))
            } else if (authMethod === "google") {
                authCred = await signInWithPopup(auth, new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile"))
            } else {
                throw new Error("Invalid auth method specified")
            }
        } catch (error) {
            setAuthUser(null)
            setUserStatus(UserStatus.SignInError)
            throw error
        }
        setAuthUser(authCred.user)
        setUserStatus(UserStatus.SignedIn)
        // navigate("/profile")
    }

    const logout = () => {
        signOut(auth)
            .then(() => {
                setUser(null)
                setAuthUser(null)
                console.log("Signed out successfully")
                // navigate("/", { replace: true })
            })
            .catch(error => { console.log("Error signing out: ", error) })
    }

    auth.onAuthStateChanged(authUser => {
        if (authUser) {
            setProfileStatus(ProfileStatus.LoadingProfile)
            fetchUser(authUser)
                .then(res => { setUser(res.status === LoadStatus.Success ? res.user : null) })
        } else {
            setUser(null)
        }
    })

    const value = useMemo(() => ({ user, userStatus, profileStatus, login, logout, updateProfile }), [user])
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const userContext = useContext(UserContext)
    if (!userContext) { throw new Error("No AuthContext provider found") }
    return userContext
}