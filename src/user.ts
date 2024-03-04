import { z } from "zod"
import { StateCreator, create } from "zustand"
import { PersistOptions, persist } from "zustand/middleware"
import "firebaseui/dist/firebaseui.css"
import {
    getAuth,
    User as AuthUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GithubAuthProvider,
    GoogleAuthProvider,
    // browserPopupRedirectResolver,
} from "firebase/auth"
import { formatISO } from "date-fns"

import { app } from "./firebase"

interface UserState {
    userProfile: UserProfile | null
    entries: Record<string, Entry> | null
    tags: Tag[] | null
    profileLastUpdated: number | null
    userAuth: AuthUser | null
    profileStatus: ProfileStatus
    authStatus: AuthStatus
    setProfile: (profile: UserProfile | null) => void
    // setEntry: (entry: Entry) => void
    setEntries: (entries: Record<string, Entry> | null) => void
    setTags: (tags: Tag[] | null) => void
    loadingProfile: boolean
    loadingAuth: boolean
    login: (
        authMethod: AuthMethod,
        data: { email: string; password: string } | undefined
    ) => Promise<FetchStatus>
    logout: () => void
    updateProfile: (formData: ProfileFormData) => Promise<FetchStatus>
    // updateContent: (entries: Entry[], tags: Tag[]) => Promise<FetchStatus>
    addUpdateEntry: (formData: EntryFormData) => Promise<FetchStatus>
    setAuth: (auth: AuthUser | null) => void
    shouldUpdateProfile: (auth: AuthUser) => boolean
    isLoading: () => boolean
}

type UserPersist = (
    config: StateCreator<UserState>,
    options: PersistOptions<UserState, Partial<UserState>>
) => StateCreator<UserState>

export const useUserStore = create<UserState>()(
    (persist as UserPersist)(
        (set, get) => ({
            userProfile: null,
            userAuth: null,
            profileLastUpdated: null,
            loadingProfile: false,
            loadingAuth: false,
            entries: null,
            tags: null,
            profileStatus: ProfileStatus.NoProfile,
            authStatus: AuthStatus.NoUser,
            setProfile: profile => {
                console.log("setProfile - input: " + JSON.stringify(profile))
                const completeProfile = UserProfileZ.safeParse(profile)
                if (completeProfile.success) {
                    set(() => ({
                        userProfile: completeProfile.data,
                        profileStatus: ProfileStatus.CompleteProfile,
                    }))
                    console.log("Set complete profile")
                } else {
                    const incompleteProfile = InitialUserZ.safeParse(profile)
                    if (incompleteProfile.success) {
                        set(() => ({
                            userProfile: incompleteProfile.data as UserProfile,
                            profileStatus: ProfileStatus.IncompleteProfile,
                        }))
                        console.log("Set incomplete profile")
                    } else {
                        set(() => ({
                            userProfile: null,
                            profileStatus: ProfileStatus.NoProfile,
                        }))
                        console.log(
                            "Set null profile due to parse error: " +
                                incompleteProfile.error
                        )
                    }
                }
            },
            // setEntry: newEntry => {
            //     const entries = get().entries
            //     if (!entries) {
            //         set(() => ({ entries: [newEntry] }))
            //         return
            //     }
            //     var replaceExisting = false
            //     entries.forEach((entry, entryIdx) => {
            //         if (entry.start === newEntry.start) {
            //             entries[entryIdx] = newEntry
            //             replaceExisting = true
            //         }
            //     })
            //     if (!replaceExisting) {
            //         entries.push(newEntry)
            //     }
            // },
            setEntries: entries => {
                const result = z.record(ISODateZ, EntryZ).safeParse(entries)
                if (result.success) {
                    set(() => ({ entries: result.data }))
                    console.log("Set entries to " + JSON.stringify(result.data))
                } else {
                    // set(() => ({ entries: null }))
                    console.error("Invalid entries to update, not setting")
                }
            },
            setTags: tags => {
                const result = z.array(TagZ).safeParse(tags)
                if (result.success) {
                    set(() => ({ tags: result.data }))
                } else {
                    set(() => ({ tags: null }))
                }
            },
            login: async (authMethod, data) => {
                set(() => ({ loadingAuth: true }))
                try {
                    if (authMethod === "emailPassword" && data) {
                        console.log(
                            `Signing in with ${data.email}, ${data.password}`
                        )
                        try {
                            await signInWithEmailAndPassword(
                                auth,
                                data.email,
                                data.password
                            )
                        } catch {
                            await createUserWithEmailAndPassword(
                                auth,
                                data.email,
                                data.password
                            )
                        }
                    } else if (authMethod === "github") {
                        await signInWithPopup(
                            auth,
                            new GithubAuthProvider().addScope("read:user")
                            // browserPopupRedirectResolver
                        )
                    } else if (authMethod === "google") {
                        await signInWithPopup(
                            auth,
                            new GoogleAuthProvider().addScope(
                                "https://www.googleapis.com/auth/userinfo.email"
                            )
                            // browserPopupRedirectResolver
                        )
                    } else {
                        console.error("Invalid auth method specified")
                        return Promise.reject(FetchStatus.Error)
                    }
                } catch (error) {
                    get().setAuth(null)
                    console.error("Error signing in")
                    return Promise.reject(FetchStatus.Error)
                } finally {
                    set(() => ({ loadingAuth: false }))
                    return Promise.resolve(FetchStatus.Success)
                }
            },
            logout: () => {
                set(() => ({ loadingAuth: true }))
                signOut(auth).finally(() => {
                    set(() => ({ loadingAuth: false }))
                })
            },
            updateProfile: async formData => {
                const userAuth = get().userAuth
                const currentProfile = get().userProfile
                if (
                    !userAuth ||
                    !currentProfile ||
                    get().authStatus !== AuthStatus.SignedIn
                ) {
                    throw new Error("Invalid user session for updating content")
                }
                const newProfile = {
                    ...currentProfile,
                    name: formData.name,
                    birth:
                        formData.birth instanceof Date
                            ? formatISO(formData.birth, {
                                  representation: "date",
                              })
                            : formData.birth,
                    expYears: parseInt(formData.expYears),
                }
                const result = UserProfileZ.safeParse(newProfile)
                if (result.success) {
                    const { name, birth, expYears } = result.data
                    return userAuth
                        .getIdToken()
                        .then(idToken =>
                            fetch(
                                `${BACKEND_URL}/updateUserProfile?uid=${userAuth.uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}`
                            )
                        )
                        .then(res => {
                            if (!res.ok) {
                                console.error(
                                    "Invalid server response for updating content"
                                )
                                return Promise.reject(FetchStatus.Error)
                            }
                            get().setProfile(newProfile)
                            console.log(
                                `Updated profile: ${JSON.stringify(newProfile)}`
                            )
                            return Promise.resolve(FetchStatus.Success)
                        })
                } else {
                    return Promise.reject(FetchStatus.Error)
                }
            },
            // updateContent: async (entries, tags) => {
            //     const userAuth = get().userAuth
            //     if (
            //         !userAuth ||
            //         !get().userProfile ||
            //         get().authStatus !== AuthStatus.SignedIn
            //     ) {
            //         throw new Error("Invalid user session for updating content")
            //     }
            //     return userAuth
            //         .getIdToken()
            //         .then(idToken =>
            //             fetch(
            //                 `${BACKEND_URL}/updateContent?uid=${userAuth.uid}&idToken=${idToken}&entries=${entries}&tags=${tags}`
            //             )
            //         )
            //         .then(res => {
            //             if (!res.ok) {
            //                 throw new Error(
            //                     "Invalid server response for updating content"
            //                 )
            //             }
            //             get().setEntries(entries)
            //             get().setTags(tags)
            //             return FetchStatus.Success
            //         })
            // },
            addUpdateEntry: async formData => {
                const userAuth = get().userAuth
                if (
                    !userAuth ||
                    !get().userProfile ||
                    get().authStatus !== AuthStatus.SignedIn
                ) {
                    throw new Error(
                        "Invalid user session for adding/updating entry"
                    )
                }
                const result = NewEntryZ.safeParse({
                    start: formatISO(formData.start, {
                        representation: "date",
                    }),
                    note: formData.note,
                    tags: formData.tags,
                })
                if (!result.success) {
                    console.error(
                        "Invalid entry input: " + JSON.stringify(formData)
                    )
                    return Promise.reject(FetchStatus.Error)
                }
                const { start, note, tags } = result.data

                return userAuth
                    .getIdToken()
                    .then(idToken =>
                        fetch(
                            `${BACKEND_URL}/addUpdateEntry?uid=${
                                userAuth.uid
                            }&idToken=${idToken}&start=${start}&note=${note}&tags=${encodeURIComponent(
                                JSON.stringify(tags)
                            )}`
                        )
                    )
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(
                                "Invalid server response for updating entry"
                            )
                        }
                        return res.json()
                    })
                    .then(res => {
                        const fetched = z
                            .record(ISODateZ, EntryZ)
                            .safeParse(res.entries)
                        console.log(JSON.stringify(res.entries))
                        if (!fetched.success) {
                            throw new Error(
                                "Invalid new entry response from server: " +
                                    fetched.error
                            )
                        }
                        get().setEntries(fetched.data)
                        console.log(
                            `Updated entry: ${JSON.stringify(fetched.data)}`
                        )
                        return Promise.resolve(FetchStatus.Success)
                    })
                    .catch(error => {
                        console.error(
                            "Error while adding/updating entry: " +
                                error.message
                        )
                        return Promise.reject(FetchStatus.Error)
                    })
            },
            setAuth: (auth: AuthUser | null) => {
                if (!auth) {
                    set(() => ({
                        userAuth: null,
                        entries: null,
                        tags: null,
                        authStatus: AuthStatus.NoUser,
                    }))
                    get().setProfile(null)
                    return
                }
                set(() => ({
                    userAuth: auth,
                    authStatus: AuthStatus.SignedIn,
                }))
                if (get().shouldUpdateProfile(auth)) {
                    set(() => ({ loadingProfile: true }))
                    // console.log(`Loading user profile. --- userToUpdate is null? ${!userToLoad}, user is null? ${!userProfile}, last updated is null? ${!userLastUpdated}, userToLoad: ${userToLoad}`)
                    auth.getIdToken(true)
                        .then(idToken =>
                            fetch(
                                `${BACKEND_URL}/getUserAndEntries?uid=${auth.uid}&idToken=${idToken}`
                            )
                        )
                        .then(res => {
                            if (!res.ok) {
                                res.text()
                                    .then(text => {
                                        throw new Error(
                                            "Server error while loading profile, response: " +
                                                text
                                        )
                                    })
                                    .catch(error => {
                                        throw new Error(
                                            "Server error, and error parsing server response: " +
                                                error.message
                                        )
                                    })
                                    .finally(() => {
                                        set(() => ({ loadingProfile: false }))
                                    })
                            } else {
                                res.json()
                                    .then(profileAndContent => {
                                        // if (profile.created) { profile.created = new Date(profile.created).toISOString() }
                                        if (profileAndContent.birth) {
                                            profileAndContent.birth = formatISO(
                                                new Date(
                                                    profileAndContent.birth
                                                ),
                                                { representation: "date" }
                                            )
                                        }
                                        const { entries, tags, ...profile } =
                                            profileAndContent
                                        console.log(
                                            `Fetched profile - created: ${profile.created}, birth: ${profile.birth}`
                                        )
                                        get().setProfile(profile)
                                        get().setEntries(entries)
                                        get().setTags(tags)
                                        set(() => ({
                                            profileLastUpdated: Date.now(),
                                        }))
                                        console.log(
                                            `Updated profile! --- last updated: ${
                                                get().profileLastUpdated
                                            }, now: ${Date.now()}`
                                        )
                                    })
                                    .catch(error => {
                                        get().setProfile(null)
                                        get().setEntries(null)
                                        get().setTags(null)
                                        throw new Error(
                                            "Error parsing user: " +
                                                error.message
                                        )
                                    })
                                    .finally(() => {
                                        set(() => ({ loadingProfile: false }))
                                    })
                            }
                        })
                } else {
                    console.log("Not loading new profile")
                }
            },
            shouldUpdateProfile: auth => {
                const { profileLastUpdated, userProfile } = get()
                const result =
                    !get().loadingProfile &&
                    (!userProfile ||
                        userProfile.uid !== auth.uid ||
                        !profileLastUpdated ||
                        Date.now() - profileLastUpdated > 120000)
                // console.log(`shouldUpdateProfile: loading? ${get().loadingProfile}, userProfile: ${userProfile}, userLastUpdated outdated: ${(Date.now() - profileLastUpdated) > 120000}, result: ${result}`)
                return result
            },
            isLoading: () =>
                (get().loadingProfile ||
                    get().loadingAuth ||
                    !get().userProfile ||
                    !get().userAuth) &&
                get().authStatus !== AuthStatus.NoUser,
        }),
        {
            name: "userProfile",
            partialize: state => ({
                userProfile: state.userProfile,
                entries: state.entries,
                tags: state.tags,
                profileLastUpdated: state.profileLastUpdated,
                profileStatus: state.profileStatus,
            }),
            onRehydrateStorage: state => {
                if (state.userProfile && state.entries && state.tags) {
                    console.log(`Rehydrating with profile ${state.userProfile}`)
                    state.loadingProfile = true
                    state.setProfile(state.userProfile)
                    state.setEntries(state.entries)
                    state.setTags(state.tags)
                    state.loadingProfile = false
                    console.log("Done rehydrating")
                } else {
                    console.log("Not rehydrating null values")
                }
            },
        }
    )
)

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
export const BACKEND_URL =
    "https://us-central1-lifecal-backend.cloudfunctions.net"

export enum FetchStatus {
    Loading = "Loading",
    Success = "Success",
    Error = "Error",
}

export enum AuthStatus {
    SignedIn = "User signed in",
    // SignInError = "Error signing user in",
    SigningIn = "Signing in",
    NoUser = "No user session",
}

export enum ProfileStatus {
    CompleteProfile = "Completed profile",
    IncompleteProfile = "Incomplete profile",
    InvalidProfile = "Invalid profile",
    ProfileLoadError = "Error loading profile",
    NoProfile = "No profile loaded",
}

const authMethods = ["emailPassword", "github", "google"] as const
export type AuthMethod = (typeof authMethods)[number]

export const auth = getAuth(app)

export const LoginFormEntryZ = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const TagZ = z.object({
    id: z.number(),
    created: z.string().datetime(),
    name: z.string(),
    color: z.string(),
})
export type Tag = z.infer<typeof TagZ>

export const ISODateZ = z.string().refine(i => /^\d{4}-\d{2}-\d{2}$/.test(i))

export const EntryZ = z.object({
    created: z.string().datetime(),
    start: ISODateZ,
    note: z.string(),
    tags: z.array(z.string()),
})
export const NewEntryZ = EntryZ.partial({ id: true, created: true })
export type Entry = z.infer<typeof EntryZ>

export const UserProfileZ = z.object({
    uid: z.string(),
    created: z.string().datetime(),
    name: z.string(),
    birth: ISODateZ,
    expYears: z.number().refine(i => i > 0),
    email: z.string().email(),
})
export type UserProfile = z.infer<typeof UserProfileZ>

export const InitialUserZ = UserProfileZ.partial({
    name: true,
    birth: true,
    expYears: true,
    email: true,
})

export type ProfileFormData = {
    name: string
    birth: string | Date
    expYears: string
}

export type EntryFormData = {
    start: Date
    note: string
    tags: string[]
}
