import { z } from "zod"
import { createContext, useContext, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@mantine/hooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, AuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

import { auth, LoadStatus, UserStatus, User, UserZ, InitialUserZ, fetchUser } from "./user"

const UserAuthContext = createContext({ defaultValue: undefined })

const authMethods = ["emailPassword", "github", "google"] as const
type AuthMethod = typeof authMethods[number]

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const UserAuthProvider = ({ children }) => {
    const [user, setUser] = useLocalStorage<User | null>({ key: "user", defaultValue: null })
    const [userStatus, setUserStatus] = useLocalStorage({ key: "userStatus", defaultValue: UserStatus.NoUser })
    const navigate = useNavigate()

    const login = async (authMethod: AuthMethod, data) => {
        var user = null
        if (authMethod === "emailPassword") {
            user = signInWithEmailAndPassword(auth, data.email, data.password)
                .catch(_ => createUserWithEmailAndPassword(auth, data.email, data.password))
                .then(res => res.user)
        } else if (authMethod === "github") {
            user = signInWithPopup(auth, new GithubAuthProvider().addScope("read:user"))
                .then(res => res.user)
        } else if (authMethod === "google") {
            user = signInWithPopup(auth, new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile"))
                .then(res => res.user)
        } else {
            throw new Error("Invalid auth method specified")
        }
        user.then(user => setUser(user))
        // TODO: Fix User type above which isn't valid

        .catch(error => { console.log("Error logging in: ", error.message) })
        setUser(auth.)
        navigate("/profile")
    }

    const logout = () => {
        signOut(auth)
            .then(() => { console.log("Signed out successfully") })
            .catch(error => { console.log("Error signing out: ", error) })
            .then(() => { navigate("/", { replace: true }) })
    }

    auth.onAuthStateChanged(authUser => {
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