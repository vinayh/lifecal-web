import { useState, useEffect } from "react"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Box } from "@mantine/core"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth } from "./auth"
import { UserZ, User, Calendar } from "./Calendar"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

function UserProfile({ user: { uid, created, name = "", birth = "", expYears = "80", email = "" } }) {
    const form = useForm({
        initialValues: {
            email: email,
            name: name,
            birth: birth,
            expYears: expYears
        },

        validate: {
            email: (value) => /^\S+@\S+$/.test(value) ? null : "Invalid email",
            name: (value) => (value.length >= 1) ? null : "Invalid name",
            birth: (value) => !isNaN(Date.parse(value)) ? null : "Invalid date of birth",
            expYears: (value) => /^-?\d+$/.test(value) ? null : "Invalid life expectancy"
        },
    });

    return <p>User profile here</p>
    return (
        <Box maw={340} mx="auto">
            UID: {uid}, user created: {created}
            <form onSubmit={form.onSubmit((values) => console.log(values))}>
                <TextInput
                    withAsterisk
                    label="Email"
                    placeholder="your@email.com"
                    {...form.getInputProps("email")}
                />

                <TextInput
                    withAsterisk
                    label="Name"
                    placeholder="your@email.com"
                    {...form.getInputProps("email")}
                />

                <DateInput
                    withAsterisk
                    label="Date input"
                    placeholder="1 January 1984"
                    {...form.getInputProps("date")}
                />

                <TextInput
                    withAsterisk
                    label="Life expectancy (years)"
                    placeholder="80"
                    {...form.getInputProps("email")}
                />

                <Group justify="flex-end" mt="md">
                    <Button type="submit">Submit</Button>
                </Group>
            </form>
        </Box>
    )
}

export function Dashboard(props) {
    const [authUser, authLoading, authError] = useAuthState(auth)
    const [user, setUser] = useState<User | undefined>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | undefined>()
    if (authLoading || authError || !authUser) { return <p>Loading...</p> }

    useEffect(() => {
        async function fetchUser() {
            if (authUser == null) {
                setError("Invalid user session")
            } else {
                await authUser.getIdToken(true)
                    .then(idToken => fetch(`${BACKEND_URL}/getUser?idToken=${idToken}`))
                    .then(res => res.json())
                    .then(res => {
                        if (!res.ok) { throw new Error("User not found") }
                        setUser(res)
                    })
                    .catch(error => { throw error })
                setLoading(false)
            }
        }
        fetchUser()
    })
    if (loading) {
        return <p>Loading user data...</p>
    } else if (error) {
        return <p>Error loading user</p>
    } else {
        const result = UserZ.safeParse(user)
        if (!result.success) {
            return <UserProfile user={user} />
        } else {
            return <Calendar user={result.data} />
        }
    }
}