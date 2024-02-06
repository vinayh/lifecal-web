import { SetStateAction, useState, Dispatch } from "react";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Text, Paper, Center, Container } from "@mantine/core";
import { User as AuthUser } from "firebase/auth"
import { auth, User, Status, ProfileFormEntry, updateUserProfile, fetchUser } from "./user";
import { BACKEND_URL } from "./Dashboard";

export function UserProfile({ user, authUser }: { user: User | null, authUser: AuthUser | null | undefined }) {
    const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [updateStatus, setUpdateStatus] = useState<Status | null>(null);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);

    const { uid, name, birth, expYears, email } = user

    const onSubmitProfileUpdate = (formEntry: ProfileFormEntry) => {
        form.validate()
        setUpdateStatus(Status.Loading)
        setUpdateMessage("Saving profile...")
        if (authUser !== null && authUser !== undefined) {
            updateUserProfile(authUser, formEntry)
                .then(res => {
                    setUpdateStatus(res.status)
                    setUpdateMessage(res.message)
                })
        }
    }

    const form = useForm({
        initialValues: {
            email: email !== null ? email : "",
            name: name !== null ? name : "",
            birth: birth !== null ? birth : "",
            expYears: expYears !== null ? expYears : ""
        },

        validate: {
            email: value => /^\S+@\S+$/.test(value) ? null : "Invalid email",
            name: value => (value !== undefined && value.length >= 1) ? null : "Invalid name",
            birth: value => (value instanceof Date || !isNaN(Date.parse(value))) ? null : "Invalid date of birth",
            expYears: value => ((typeof value === "number" || /^-?\d+$/.test(value)) && parseInt(value) > 0) ? null : "Invalid life expectancy"
        },
    });

    return <>
        <p>{authUser.uid}</p>
        <Center pt={25}>
            <Paper radius="md" p="xl" shadow="lg" w={400}>
                <Text size="lg" fw={500}>
                    Update profile
                </Text>
                <form onSubmit={form.onSubmit(onSubmitProfileUpdate)}>
                    <TextInput
                        withAsterisk
                        label="Email"
                        placeholder="your@email.com"
                        {...form.getInputProps("email")} />

                    <TextInput
                        withAsterisk
                        label="Name"
                        {...form.getInputProps("name")} />

                    <DateInput
                        withAsterisk
                        label="Date of birth"
                        placeholder="1 January 1984"
                        {...form.getInputProps("birth")} />

                    <TextInput
                        withAsterisk
                        label="Life expectancy (years)"
                        placeholder="80"
                        {...form.getInputProps("expYears")} />

                    <Group justify="flex-end" mt="md">
                        <Button type="submit" radius="md" w={110}>Submit</Button>
                    </Group>
                </form>
            </Paper>
        </Center>
    </>
}