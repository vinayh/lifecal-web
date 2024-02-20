import { z } from "zod"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { TextInput, Button, Group, rem, Box, Title } from "@mantine/core"

import { ProfileFormData, useUserStore } from "./user"
import { IconCheck, IconX } from "@tabler/icons-react"
import "@mantine/dates/styles.css"

export function UserProfile() {
    const { updateProfile, userProfile } = useUserStore()

    const onSubmitProfileUpdate = (formEntry: ProfileFormData) => {
        form.validate()
        const id = notifications.show({
            loading: true,
            title: "Updating profile",
            message: "Please wait...",
            autoClose: false,
            withCloseButton: false,
        })
        updateProfile(formEntry)
            .then(() => {
                console.log("Success received")
                notifications.update({
                    id,
                    color: "teal",
                    title: "Profile updated",
                    message: "Profile changes have been saved.",
                    icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
                    loading: false,
                    autoClose: 3000
                })
            })
            .catch(error => {
                notifications.update({
                    id,
                    color: "red",
                    title: "Error",
                    message: "Error updating profile.",
                    icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
                    loading: false,
                    autoClose: 3000
                })
                console.error("Profile update error: " + JSON.stringify(error))
            })
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

    return <Box maw={500} mx="auto">
        <Title order={2}>Update profile</Title>
        <form onSubmit={form.onSubmit(onSubmitProfileUpdate)}>
            <TextInput
                withAsterisk
                disabled
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
    </Box>
}
