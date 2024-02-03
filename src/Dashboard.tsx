import { useState, useEffect } from "react"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates";
import { Alert, TextInput, Button, Group, Box } from "@mantine/core"
import { useAuthState } from "react-firebase-hooks/auth"
import { IconCheckbox } from '@tabler/icons-react';

import { auth } from "./user"
import { UserZ, User, Calendar } from "./Calendar"

// const BACKEND_URL = "http://127.0.0.1:5001/lifecal-backend/us-central1"
const BACKEND_URL = "https://us-central1-lifecal-backend.cloudfunctions.net"

function UserProfile({ user: { uid, created, name, birth, expYears, email } }: { user: User }) {
    const [updating, setIsUpdating] = useState(false)
    const [updateAlert, setUpdateAlert] = useState()
    const [authUser, authLoading, authError] = useAuthState(auth)

    const onSubmit = (formSubmission) => {
        setIsUpdating(true)
        const { name, birth, expYears, email } = formSubmission
        if (!(authUser == null)) {
            authUser.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUser?uid=${uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (res.ok) { /* set update success alert here */ }
                    else { /* set update failed alert here */ }
                })
        }

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
        birth: (value) => !isNaN(Date.parse(value)) ? null : "Invalid date of birth",
        expYears: (value) => /^-?\d+$/.test(value) ? null : "Invalid life expectancy"
    },
});

return (
    <Box maw={340} mx="auto">
        UID: {uid}, user created: {created.toISOString()}
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
                return
            }
            const uid = authUser.uid
            const res = await authUser.getIdToken(false)
                .then(idToken => { console.log(idToken); return idToken })
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
    })
    if (loading) {
        return <p>Loading user data...</p>
    } else if (error) {
        return <p>Error loading user</p>
    } else if (!(user == null)) {
        const result = UserZ.safeParse(user)
        if (!result.success) {
            return <UserProfile user={user} />
        } else {
            return <Calendar user={result.data} />
        }
    }
}