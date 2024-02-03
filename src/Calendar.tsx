import { z } from "zod"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "./user"

export const TagZ = z.object({
    id: z.number(), created: z.date(), name: z.string(), color: z.string(),
});
export type Tag = z.infer<typeof TagZ>


export const EntryZ = z.object({
    id: z.number(), created: z.date(), start: z.date(), note: z.string(), tags: z.array(TagZ),
});
export type Entry = z.infer<typeof EntryZ>


export const UserZ = z.object({
    uid: z.string(), created: z.coerce.date(), name: z.string(), birth: z.coerce.date(), expYears: z.number(), email: z.string().email().optional(), entries: z.array(EntryZ), tags: z.array(TagZ),
});
export type User = z.infer<typeof UserZ>

export function Calendar({ user }: { user: User }) {

    return <>Calendar here</>
} 