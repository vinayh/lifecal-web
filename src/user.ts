import { z } from "zod"
import { create } from "zustand"
// import { persist } from "zustand/middleware"
import "firebaseui/dist/firebaseui.css"
import { getAuth, User as AuthUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GithubAuthProvider, GoogleAuthProvider, UserCredential, signOut } from "firebase/auth"
import { app } from "./firebase"

interface UserState {
    userProfile: UserProfile | null
    entries: Entry[]
    tags: Tag[]
    userAuth: AuthUser | null
    profileStatus: ProfileStatus
    authStatus: AuthStatus
    loadingProfile: boolean
    loadingAuth: boolean
    userLastUpdated: number | null
    login: (authMethod: AuthMethod, data: { email: string, password: string } | undefined) => void
    logout: () => void
    updateProfile: (formEntry: ProfileFormEntry) => Promise<FetchStatus>
    updateContent: (entries: Entry[], tags: Tag[]) => Promise<FetchStatus>
    setProfile: (profile: UserProfile | null) => void
    setAuth: (auth: AuthUser | null) => void
    setProfileStatus: (status: ProfileStatus) => void
    setAuthStatus: (status: AuthStatus) => void
    setLoadingProfile: (loading: boolean) => void
    setLoadingAuth: (loading: boolean) => void
    setUserLastUpdated: (date: number) => void
    profileIsStale: () => boolean
    isLoading: () => boolean
}

export const useUserStore = create<UserState>()(
    (set, get) => ({
        userProfile: null,
        userAuth: null,
        profileStatus: ProfileStatus.NoProfile,
        authStatus: AuthStatus.NoUser,
        loadingProfile: false,
        loadingAuth: false,
        userLastUpdated: null,
        entries: [],
        tags: [],
        login: async (authMethod, data) => {
            set(() => ({ loadingAuth: true }))
            try {
                if (authMethod === "emailPassword" && data) {
                    console.log(`Signing in with ${data.email}, ${data.password}`)
                    await signInWithEmailAndPassword(auth, data.email, data.password)
                        .catch(_ => createUserWithEmailAndPassword(auth, data.email, data.password))
                    // console.log(`Signed in, authCred: ${authCred}`)
                } else if (authMethod === "github") {
                    await signInWithPopup(auth, new GithubAuthProvider().addScope("read:user"))
                } else if (authMethod === "google") {
                    await signInWithPopup(auth, new GoogleAuthProvider().addScope("https://www.googleapis.com/auth/userinfo.profile"))
                } else {
                    throw new Error("Invalid auth method specified")
                }
            } catch (error) {
                get().setAuth(null)
                throw new Error("Error signing in!")
            } finally {
                set(() => ({ loadingAuth: false }))
            }
            // navigate("/dashboard/profile")
        },
        logout: () => {
            set(() => ({ loadingAuth: true }))
            signOut(auth)
            .finally(() => { set(() => ({ loadingAuth: false })) })
        },
        updateProfile: async (formEntry) => {
            const userAuth = get().userAuth
            const currentProfile = get().userProfile
            if (!userAuth || !currentProfile || get().authStatus !== AuthStatus.SignedIn) {
                throw new Error("Invalid user session for updating content")
            }
            const { name, birth, expYears, email } = formEntry
            const newProfile = {
                ...currentProfile,
                name: name,
                birth: (birth instanceof Date) ? birth.toISOString() : birth,
                expYears: parseInt(expYears),
                email: email
            }
            return userAuth.getIdToken()
                .then(idToken => fetch(`${BACKEND_URL}/updateUserProfile?uid=${userAuth.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Invalid server response for updating content")
                    }
                    set({ userProfile: newProfile })
                    return FetchStatus.Success
                })
        },
        updateContent: async (entries, tags) => {
            const userAuth = get().userAuth
            if (!userAuth || !get().userProfile || get().authStatus !== AuthStatus.SignedIn) {
                throw new Error("Invalid user session for updating content")
            }
            return userAuth.getIdToken()
                .then(idToken => fetch(`${BACKEND_URL}/updateContent?uid=${userAuth.uid}&idToken=${idToken}&entries=${entries}&tags=${tags}`))
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Invalid server response for updating content")
                    }
                    set({
                        entries: entries,
                        tags: tags
                    })
                    return FetchStatus.Success
                })
        },
        setProfile: (profile) => {
            if (!profile) {
                set(() => ({
                    userProfile: null,
                    profileStatus: ProfileStatus.NoProfile
                }))
            } else {
                const result = UserProfileZ.safeParse(profile)
                if (result.success) {
                    console.log("Setting complete user profile: " + JSON.stringify(result.data))
                    set(() => ({
                        userProfile: result.data,
                        profileStatus: ProfileStatus.CompleteProfile
                    }))
                } else {
                    const initResult = InitialUserZ.safeParse(profile)
                    if (initResult.success) {
                        console.log("Setting initial incomplete profile")
                        set(() => ({
                            userProfile: initResult.data as UserProfile,
                            profileStatus: ProfileStatus.IncompleteProfile
                        }))
                    } else {
                        console.log("Setting invalid/null profile: " + JSON.stringify(profile) + "\n\n" + initResult.error)
                        set(() => ({
                            userProfile: null,
                            profileStatus: ProfileStatus.InvalidProfile
                        }))
                    }
                }
            }
        },
        setAuth: (auth: AuthUser | null) => {
            if (!auth) {
                set(() => ({
                    userAuth: null,
                    userProfile: null,
                    authStatus: AuthStatus.NoUser,
                    profileStatus: ProfileStatus.NoProfile
                }))
                return
            }
            set(() => ({
                userAuth: auth,
                authStatus: AuthStatus.SignedIn
            }))
            const userProfile = get().userProfile
            if (!get().loadingProfile && (!userProfile || userProfile.uid !== auth.uid || get().profileIsStale())) {
                set(() => ({ loadingProfile: true }))
                // console.log(`Loading user profile. --- userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
                auth.getIdToken(true)
                    .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${auth.uid}&idToken=${idToken}`))
                    .then(res => {
                        if (!res.ok) {
                            res.text()
                                .then(text => { throw new Error("Server error while loading profile, response: " + text) })
                                .catch(error => { throw new Error("Server error, and error parsing server response: " + error.message) })
                                .finally(() => { set(() => ({ loadingProfile: false })) })
                        } else {
                            res.json()
                                .then(profile => {
                                    // if (profile.created) { profile.created = new Date(profile.created).toISOString() }
                                    // if (profile.birth) { profile.birth = new Date(profile.birth).toISOString() }
                                    console.log(`Fetched profile - created: ${profile.created}, birth: ${profile.birth}`)
                                    get().setProfile(profile)
                                    set(() => ({ userLastUpdated: Date.now() }))
                                    // console.log(`Updated profile! --- userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
                                })
                                .catch(error => {
                                    get().setProfile(null)
                                    throw new Error("Error parsing user: " + error.message)
                                })
                                .finally(() => { set(() => ({ loadingProfile: false })) })
                        }
                    })
            } else {
                console.log("Not loading new profile")
            }
        },
        setProfileStatus: (status) => set(() => ({ profileStatus: status })),
        setAuthStatus: (status) => set(() => ({ authStatus: status })),
        setLoadingProfile: (loading) => set(() => ({ loadingProfile: loading })),
        setLoadingAuth: (loading) => set(() => ({ loadingAuth: loading })),
        setUserLastUpdated: (date) => set(() => ({ userLastUpdated: date })),
        profileIsStale: () => {
            const userLastUpdated = get().userLastUpdated
            return !get().userProfile || !userLastUpdated || !get().userAuth || (Date.now() - userLastUpdated) > 120000
        },
        isLoading: () => (get().loadingProfile || get().loadingAuth || !get().userProfile || !get().userAuth) && (get().authStatus !== AuthStatus.NoUser)
    }))

// const [loadingProfile, setLoadingProfile] = useState(false)
// const [loadingAuth, setLoadingAuth] = useState(false)
// const [userAuth, setUserAuthHelper] = useState<AuthUser | null>(null)
// const [userProfile, setUserProfileHelper] = useLocalStorage<UserProfile | null>("userProfile", null)
// const [userLastUpdated, setUserLastUpdated] = useLocalStorage<number | null>("userLastUpdated", null)
// const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.NoUser)
// const profileStatus = useRef<ProfileStatus>(ProfileStatus.NoProfile)

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
export const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

export enum FetchStatus {
    Loading = "Loading",
    Success = "Success",
    Error = "Error"
}

export enum AuthStatus {
    SignedIn = "User signed in",
    // SignInError = "Error signing user in",
    SigningIn = "Signing in",
    NoUser = "No user session"
}

export enum ProfileStatus {
    CompleteProfile = "Completed profile",
    IncompleteProfile = "Incomplete profile",
    InvalidProfile = "Invalid profile",
    ProfileLoadError = "Error loading profile",
    NoProfile = "No profile loaded"
}

const authMethods = ["emailPassword", "github", "google"] as const
export type AuthMethod = typeof authMethods[number]

export const auth = getAuth(app)

export const LoginFormEntryZ = z.object({ email: z.string().email(), password: z.string() })

export const TagZ = z.object({
    id: z.number(), created: z.string().datetime(), name: z.string(), color: z.string(),
});
export type Tag = z.infer<typeof TagZ>


export const EntryZ = z.object({
    id: z.number(), created: z.string().datetime(), start: z.string().datetime(), note: z.string(), tags: z.array(TagZ),
});
export type Entry = z.infer<typeof EntryZ>


export const UserProfileZ = z.object({
    uid: z.string(), created: z.string().datetime(), name: z.string(), birth: z.string().datetime(), expYears: z.number(), email: z.string().email()
});
export type UserProfile = z.infer<typeof UserProfileZ>

export const InitialUserZ = UserProfileZ.partial({ name: true, birth: true, expYears: true, email: true })

export type ProfileFormEntry = { name: string, birth: string | Date, expYears: string, email: string }
