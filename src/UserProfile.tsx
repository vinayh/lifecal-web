import { z } from "zod"
import { SetStateAction, useState, Dispatch } from "react";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Text, Paper, Center, Container } from "@mantine/core";
import { LoadStatus, ProfileFormEntry, ProfileStatus } from "./user";
import { useAwaitedUser, useUser } from "./useUser";
import usePromise from "react-promise-suspense";

export function UserProfile() {
    // const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [updateStatus, setUpdateStatus] = useState<LoadStatus | null>(null)
    const [updateMessage, setUpdateMessage] = useState<string | null>(null)
    
    // const [{ updateProfile, profileStatus, authStatus }, userAuth, userProfile] = usePromise(useAwaitedUser, [])
    const { updateProfile, profileStatus, authStatus, userAuth, userProfile } = useUser()

    const { name, birth, expYears, email } = userProfile

    const onSubmitProfileUpdate = (formEntry: ProfileFormEntry) => {
        form.validate()
        setUpdateStatus(LoadStatus.Loading)
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
            email: email !== null ? email : "",
            name: name !== null ? name : "",
            birth: birth !== null ? new Date(birth) : "",
            expYears: expYears !== null ? expYears : ""
        },

        validate: {
            email: value => /^\S+@\S+$/.test(value) ? null : "Invalid email",
            name: value => (value !== undefined && value.length >= 1) ? null : "Invalid name",
            birth: value => (value instanceof Date || z.string().datetime().safeParse(value).success) ? null : "Invalid date of birth",
            expYears: value => ((typeof value === "number" || (/^-?\d+$/.test(value)) && parseInt(value) > 0)) ? null : "Invalid life expectancy"
        },
    });

    if (!userAuth || !userProfile) {
        return <p>{JSON.stringify(userProfile)} <br></br> Auth: {JSON.stringify(userAuth)} <br></br> authStatus: {authStatus}, Profile: {profileStatus.current}</p>
    }


    return <>
        <p>{userProfile.uid}<br></br>{userAuth.uid}</p>
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
