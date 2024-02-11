import { z } from "zod"
import { createContext, useContext, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@mantine/hooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, AuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, LoadStatus, UserStatus, User, UserZ, InitialUserZ, fetchUser } from "./user"

const UserAuthContext = createContext({ defaultValue: undefined })

const authMethods = ["emailPassword", "github", "google"] as const
type AuthMethod = typeof authMethods[number]

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserAuthProvider = ({ children }) => {
    const [user, setUser] = useLocalStorage<User | null>({ key: "user", defaultValue: null })
    const [userStatus, setUserStatus] = useLocalStorage({ key: "userStatus", defaultValue: UserStatus.NoUser })
    const [authUser, authLoading, authError] = useAuthState(auth)
    const navigate = useNavigate()

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

    const login = async (authMethod: AuthMethod, data) => {
        setUserStatus(UserStatus.SigningIn)
        if (authMethod === "emailPassword") {
            await signInWithEmailAndPassword(auth, data.email, data.password)
                .catch(_ => createUserWithEmailAndPassword(auth, data.email, data.password))
        } else if (authMethod === "github") {
            await signInWithPopup(auth, new GithubAuthProvider().addScope("read:user"))
        } else if (authMethod === "google") {
            await signInWithPopup(auth, new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile"))
        } else {
            throw new Error("Invalid auth method specified")
        }
        setUserStatus(UserStatus.SignedIn)
        navigate("/profile")
    }

    const logout = () => {
        signOut(auth)
            .then(() => setUserStatus(UserStatus.NoUser))
            .then(() => { console.log("Signed out successfully") })
            .catch(error => { console.log("Error signing out: ", error) })
            .then(() => { navigate("/", { replace: true }) })
    }

    auth.onAuthStateChanged(authUser => {
        setUserStatus(UserStatus.LoadingProfile)
        if (authUser) {
            fetchUser(authUser)
                .then(res => {
                    if (res.status === LoadStatus.Success) {
                        console.log(res.user)
                        const result = UserZ.safeParse(res.user)
                        if (result.success) {
                            setUser(result.data)
                            setUserStatus(UserStatus.CompleteProfile)
                        } else {
                            const initResult = InitialUserZ.safeParse(res.user)
                            if (initResult.success) {
                                setUser(initResult.data as User)
                                setUserStatus(UserStatus.IncompleteProfile)
                            } else {
                                setUserStatus(UserStatus.InvalidProfile)
                            }
                        }
                    } else {
                        setUserStatus(UserStatus.ProfileLoadError)
                    }
                })
        } else {
            setUser(null)
            setUserStatus(UserStatus.NoUser)
        }
    })

    const value = useMemo(() => ({ user, login, logout, defaultValue: undefined }), [user])
    return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
}

export const useAuth = () => {
    return useContext(UserAuthContext)
}