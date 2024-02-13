import { z } from "zod"
import { getAuth } from "firebase/auth"
import "firebaseui/dist/firebaseui.css"

import { app } from "./firebase"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
export const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

export enum LoadStatus {
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
    UpdatingProfile = "Updating profile",
    InvalidProfile = "Invalid profile",
    LoadingProfile = "Loading profile",
    ProfileLoadError = "Error loading profile",
    NoProfile = "No profile loaded"
}

const authMethods = ["emailPassword", "github", "google"] as const
export type AuthMethod = typeof authMethods[number]

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


export const UserProfileZ = z.object({
    uid: z.string(), created: z.coerce.date(), name: z.string(), birth: z.date(), expYears: z.number(), email: z.string().email(), entries: z.array(EntryZ), tags: z.array(TagZ),
});
export type UserProfile = z.infer<typeof UserProfileZ>

export const InitialUserZ = UserProfileZ.partial({ name: true, birth: true, expYears: true, email: true })

export type ProfileFormEntry = { name: string, birth: string | Date, expYears: string | number, email: string }
