import { useState, useEffect } from "react"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Text, Paper, Center, Container } from "@mantine/core"
import { useAuthState } from "react-firebase-hooks/auth"

import { auth, UserZ, User } from "./user"
import { Calendar } from "./Calendar"
import { Status, StatusNotification } from "./StatusNotification"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

function UserProfile({ user: { uid, created, name, birth, expYears, email } }: { user: User }) {
    const [updateStatus, setUpdateStatus] = useState<Status | null>(null)
    const [updateMessage, setUpdateMessage] = useState<string | null>(null)
    const [authUser, authLoading, authError] = useAuthState(auth)

    const updateProfile = (formEntry: { name: string, birth: string | Date, expYears: string | number, email: string }) => {
        setUpdateStatus(Status.Loading)
        setUpdateMessage("Saving profile...")
        const { name, birth, expYears, email } = formEntry
        console.log(new Date(birth))
        if (!(authUser == null)) {
            authUser.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUser?uid=${uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (res.ok) {
                        setUpdateStatus(Status.Success)
                        setUpdateMessage("Profile updated.")
                    }
                    else {
                        setUpdateStatus(Status.Error)
                        setUpdateMessage("Please try again.")
                    }
                })
        }
    }
    const form = useForm({
        initialValues: {
            email: !(email == null) ? email : "",
            name: !(name == null) ? name : "",
            birth: !(birth == null) ? birth : "",
            expYears: !(expYears == null) ? expYears : ""
        },

        validate: {
            email: (value) => /^\S+@\S+$/.test(value) ? null : "Invalid email",
            name: (value) => (value.length >= 1) ? null : "Invalid name",
            birth: (value) => (value instanceof Date || !isNaN(Date.parse(value))) ? null : "Invalid date of birth",
            expYears: (value) => (typeof value === "number" || /^-?\d+$/.test(value)) ? null : "Invalid life expectancy"
        },
    });

    return (
        <Center pt={25}>
            <Paper radius="md" p="xl" shadow="lg" w={400}>
                <Text size="lg" fw={500}>
                    Update profile
                </Text>
                {/* UID: {uid}, user created: {created.toISOString()} */}
                <form onSubmit={form.onSubmit(updateProfile)}>
                    <TextInput
                        withAsterisk
                        label="Email"
                        placeholder="your@email.com"
                        {...form.getInputProps("email")}
                    />

                    <TextInput
                        withAsterisk
                        label="Name"
                        {...form.getInputProps("name")}
                    />

                    <DateInput
                        withAsterisk
                        label="Date of birth"
                        placeholder="1 January 1984"
                        {...form.getInputProps("birth")}
                    />

                    <TextInput
                        withAsterisk
                        label="Life expectancy (years)"
                        placeholder="80"
                        {...form.getInputProps("expYears")}
                    />

                    <Group preventGrowOverflow={false} wrap="nowrap" mt="md">
                        <Container w={290} p={0} h={55}>
                            <StatusNotification status={updateStatus} message={updateMessage} />
                        </Container>
                        <Button type="submit" radius="md" w={110}>Submit</Button>
                    </Group>
                </form>
            </Paper>
        </Center>
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
                return
            }
            const uid = authUser.uid
            const res = await authUser.getIdToken(false)
                .then(idToken => fetch(`${BACKEND_URL}/getUser?uid=${uid}&idToken=${idToken}`))
            if (res.ok) {
                res.json()
                    .then(user => {
                        if (!(user.created == null)) { user.created = new Date(user.created) }
                        if (!(user.birth == null)) { user.birth = new Date(user.birth) }
                        setUser(user)
                    })
                    .catch(error => { throw new Error("Error parsing user: " + error.message) })
            } else {
                res.text()
                    .then(text => { throw new Error("Server error, response: " + text) })
            }
            setLoading(false)
        }
        fetchUser()
    }, [])

    if (loading) {
        return <p>Loading user data...</p>
    } else if (error) {
        return <p>Error loading user</p>
    } else if (!(user == null)) {
        const result = UserZ.safeParse(user)
        if (!result.success) {
            return <UserProfile user={user} />
        } else {
            return <UserProfile user={user} />
            // TODO: Uncomment below to enable Calendar view for completed user profile
            // return <Calendar user={result.data} />
        }
    }
}