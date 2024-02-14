import { z } from "zod"
import { createContext, useContext, useRef, useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStorage } from "@uidotdev/usehooks"
import { signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, LoadStatus, AuthMethod, AuthStatus, UserProfile, UserProfileZ, InitialUserZ, ProfileFormEntry, ProfileStatus } from "./user"

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

export const UserProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [userAuth, setUserAuthHelper] = useState<AuthUser | null>(null)
    const [userProfile, setUserProfileHelper] = useLocalStorage<UserProfile | null>("userProfile", null)
    const authStatus = useRef<AuthStatus>(AuthStatus.NoUser)
    const profileStatus = useRef<ProfileStatus>(ProfileStatus.NoProfile)
    const [userLastUpdated, setUserLastUpdated] = useLocalStorage<number | null>("userLastUpdated", null)
    const navigate = useNavigate()

    const setUserProfile = (profile: UserProfile | null) => {
        if (!profile) {
            console.log("Setting null profile")
            setUserProfileHelper(null)
            profileStatus.current = (ProfileStatus.NoProfile)
        } else {
            const result = UserProfileZ.safeParse(profile)
            if (result.success) {
                console.log("Setting complete profile to: " + JSON.stringify(result.data))
                setUserProfileHelper(result.data)
                profileStatus.current = ProfileStatus.CompleteProfile
                console.log("userProfile: " + JSON.stringify(userProfile))
            } else {
                const initResult = InitialUserZ.safeParse(profile)
                if (initResult.success) {
                    console.log("Setting initial incomplete profile")
                    setUserProfileHelper(initResult.data as UserProfile)
                    profileStatus.current = ProfileStatus.IncompleteProfile
                } else {
                    console.log("Setting invalid/null profile: " + JSON.stringify(profile) + "\n\n" + initResult.error)
                    setUserProfileHelper(null)
                    profileStatus.current = ProfileStatus.InvalidProfile
                }
            }
        }
    }

    const setUserAuth = (authUser: AuthUser | null) => {
        if (!authUser) {
            setUserAuthHelper(null)
            setUserProfile(null)
            authStatus.current = AuthStatus.NoUser
        } else {
            setUserAuthHelper(authUser)
            authStatus.current = AuthStatus.SignedIn
            console.log(`Not loading new profile, existing auth: ${JSON.stringify(authUser)}\n\n authStatus: ${authStatus}\n\n profile: ${JSON.stringify(userProfile)}`)
        }
    }

    const updateProfile = async (formEntry: ProfileFormEntry): Promise<{ status: LoadStatus, message: string }> => {
        const oldProfileStatus = profileStatus.current
        profileStatus.current = ProfileStatus.UpdatingProfile

        if (userAuth && userProfile) {
            const { name, birth, expYears, email } = formEntry
            const newUserProfile = {
                ...userProfile,
                name: name,
                birth: birth.toISOString(),
                expYears: parseInt(expYears),
                email: email,
                entries: userProfile.entries,
                tags: userProfile.tags
            }
            console.log(`Updating profile to: ${JSON.stringify(newUserProfile)}`)
            return userAuth.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${userAuth.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (res.ok) {
                        profileStatus.current = ProfileStatus.CompleteProfile
                        userProfile.name = name
                        setUserProfile(newUserProfile)
                        return { status: LoadStatus.Success, message: "Profile updated." }
                    }
                    else {
                        profileStatus.current = oldProfileStatus
                        return { status: LoadStatus.Error, message: "Server error." }
                    }
                })
                .catch(() => {
                    profileStatus.current = oldProfileStatus
                    return { status: LoadStatus.Error, message: "Error updating profile." }
                })
        } else {
            profileStatus.current = oldProfileStatus
            return Promise.reject({ status: LoadStatus.Error, message: "Invalid user session" })
        }
    }

    const login = async (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => {
        authStatus.current = AuthStatus.SigningIn
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

    const loadProfile = async (userToLoad: AuthUser | null = userAuth): Promise<UserProfile> => {
        if (profileStatus.current === ProfileStatus.LoadingProfile || profileStatus.current === ProfileStatus.InvalidProfile || !userToLoad || !profileIsStale) {
            console.log("Not loading profile due to currently loading, invalid profile, or existing updated user data")
            return userProfile ? Promise.resolve(userProfile) : Promise.reject("Not loading profile")
        }
        profileStatus.current = ProfileStatus.LoadingProfile
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
                    // if (profile.created) { profile.created = new Date(profile.created).toISOString() }
                    // if (profile.birth) { profile.birth = new Date(profile.birth).toISOString() }
                    console.log(`Fetched profile - created: ${profile.created}, birth: ${profile.birth}`)
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
            setLoading(true)
            setUserAuth(newUserAuth)
            if (newUserAuth) {
                // console.log(`Auth state change, newUserAuth: ${JSON.stringify(newUserAuth)}`)
                if (!userProfile || !newUserAuth || userProfile.uid !== newUserAuth.uid) {
                    loadProfile(newUserAuth)
                        // .then(newProfile => console.log(`New user profile: ${JSON.stringify(newProfile)}`))
                        // .then(newProfile => resolve([newUserAuth, newProfile]))
                        .then(newUserProfile => setUserProfile(newUserProfile))
                } else {
                    console.log(`Not loading new profile, new auth: ${JSON.stringify(newUserAuth)}\n\n saved auth: ${JSON.stringify(userAuth)}\n\n authStatus: ${authStatus}\n\n profile: ${JSON.stringify(userProfile)}`)
                    // resolve([newUserAuth, userProfile])
                    // reject(`Invalid user session - userProfile: ${JSON.stringify(userProfile)}, newUserAuth ${newUserAuth}, uid different? ${userProfile.uid !== newUserAuth.uid}`)
                }
            } else {
                console.log("onAuthStateChanged - No user session")
            }
            setLoading(false)
            return () => unsubscribe()
        })
    }, [])

    const userProfilePromise = (): Promise<[AuthUser, UserProfile]> => {
        return new Promise((resolve, reject) => {
            const unsubscribe = auth.onAuthStateChanged((newUserAuth: AuthUser | null) => {
                unsubscribe()
                setUserAuth(newUserAuth)
                if (newUserAuth) {
                    // console.log(`Auth state change, newUserAuth: ${JSON.stringify(newUserAuth)}`)
                    if (!userProfile || !newUserAuth || userProfile.uid !== newUserAuth.uid) {
                        loadProfile(newUserAuth)
                            // .then(newProfile => console.log(`New user profile: ${JSON.stringify(newProfile)}`))
                            .then(newProfile => resolve([newUserAuth, newProfile]))
                    } else {
                        console.log(`Not loading new profile, new auth: ${JSON.stringify(newUserAuth)}\n\n saved auth: ${JSON.stringify(userAuth)}\n\n authStatus: ${authStatus}\n\n profile: ${JSON.stringify(userProfile)}`)
                        resolve([newUserAuth, userProfile])
                        // reject(`Invalid user session - userProfile: ${JSON.stringify(userProfile)}, newUserAuth ${newUserAuth}, uid different? ${userProfile.uid !== newUserAuth.uid}`)
                    }
                } else {
                    reject("No user session")
                }
            })
        })
    }

    const value = useMemo(() => ({ userProfile, userAuth, authStatus, profileStatus, loading, login, logout, updateProfile, loadProfile, profileIsStale, userProfilePromise: userProfilePromise }), [userProfile])
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

interface UserContextType {
    userProfile: UserProfile | null
    userAuth: AuthUser | null
    authStatus: React.MutableRefObject<AuthStatus>
    profileStatus: React.MutableRefObject<ProfileStatus>
    loading: boolean
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<{ status: LoadStatus, message: string }>
    loadProfile: () => Promise<UserProfile>
    profileIsStale: () => boolean
    userProfilePromise: () => Promise<[AuthUser, UserProfile]>
}

const UserContext = createContext<UserContextType | null>(null)

export const useUser = () => {
    const userContext = useContext(UserContext)
    if (!userContext) { throw new Error("No AuthContext provider found") }
    return userContext
}

export const useAwaitedUser = async (): Promise<[UserContextType, AuthUser, UserProfile]> => {
    const userContext = useContext(UserContext)
    if (!userContext) { return Promise.reject("No AuthContext provider found") }
    return userContext.userProfilePromise()
        .then(([newAuthUser, newUserProfile]) => [userContext, newAuthUser, newUserProfile])
        // .then(userAuth => {
        //     if (!userAuth) { return Promise.reject("No user session") }
        //     if (!userContext.profileIsStale()) { return Promise.resolve(userContext) }
        // })
        // .then(() => userContext.loadProfile())
        // .then(() => userContext)
        .catch(error => { throw new Error("Error getting awaited user context: " + error) })
}
