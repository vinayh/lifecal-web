import { z } from "zod"
import { SetStateAction, useState, Dispatch } from "react";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Text, Paper, Center, Container } from "@mantine/core";
import { FetchStatus, ProfileFormEntry, useUserStore } from "./user";

export function UserProfile() {
    // const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [updateStatus, setUpdateStatus] = useState<FetchStatus | null>(null)
    const [updateMessage, setUpdateMessage] = useState<string | null>(null)

    const { updateProfile, profileStatus, authStatus, userAuth, userProfile } = useUserStore()

    const onSubmitProfileUpdate = (formEntry: ProfileFormEntry) => {
        form.validate()
        setUpdateStatus(FetchStatus.Loading)
        setUpdateMessage("Saving profile...")
        updateProfile(formEntry)
            .then(res => {
                setUpdateStatus(res.status)
                setUpdateMessage(res.message)
            })
            .catch(error => { throw new Error("Profile update error: " + JSON.stringify(error)) })
    }

    const form = useForm({
        initialValues: {
            email: (userProfile && userProfile.email) ? userProfile.email : "",
            name: (userProfile && userProfile.name) ? userProfile.name : "",
            birth: (userProfile && userProfile.birth) ? new Date(userProfile.birth) : "",
            expYears: (userProfile && userProfile.expYears) ? userProfile.expYears.toString() : ""
        },
        validate: {
            email: value => /^\S+@\S+$/.test(value) ? null : "Invalid email",
            name: value => (value !== undefined && value.length >= 1) ? null : "Invalid name",
            birth: value => (value instanceof Date || z.string().datetime().safeParse(value).success) ? null : "Invalid date of birth",
            expYears: value => ((typeof value === "number" || (/^-?\d+$/.test(value)) && parseInt(value) > 0)) ? null : "Invalid life expectancy"
        },
    })

    return <>
        {/* <p>{userProfile.uid}<br></br>{userAuth.uid}</p> */}
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
    </>
}
