import { z } from "zod"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates"
import {
    TextInput,
    Button,
    Group,
    Box,
    Title,
    NumberInput,
} from "@mantine/core"

import { newLoading, updateError, updateSuccess } from "./notifications"
import { ProfileFormData, useUserStore } from "./user"
import "@mantine/dates/styles.css"

export function UserProfile() {
    const { updateProfile, userProfile } = useUserStore()

    const onSubmitProfileUpdate = (formEntry: ProfileFormData) => {
        form.validate()
        const id = newLoading("Updating profile", "Please wait...")
        updateProfile(formEntry)
            .then(() => {
                console.log("Success received")
                updateSuccess(
                    id,
                    "Profile updated",
                    "Profile changes have been saved."
                )
            })
            .catch(error => {
                updateError(id, "Error", "Error updating profile.")
                console.error("Profile update error: " + JSON.stringify(error))
            })
    }

    const form = useForm({
        initialValues: {
            email: userProfile && userProfile.email ? userProfile.email : "",
            name: userProfile && userProfile.name ? userProfile.name : "",
            birth:
                userProfile && userProfile.birth
                    ? new Date(userProfile.birth)
                    : "",
            expYears:
                userProfile && userProfile.expYears
                    ? userProfile.expYears.toString()
                    : "",
        },
        validate: {
            email: value => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
            name: value =>
                value !== undefined && value.length >= 1
                    ? null
                    : "Invalid name",
            birth: value =>
                value instanceof Date ||
                z.string().datetime().safeParse(value).success
                    ? null
                    : "Invalid date of birth",
            expYears: value =>
                (typeof value === "number" && value > 0) ||
                (/^-?\d+$/.test(value) && parseInt(value) > 0)
                    ? null
                    : "Invalid life expectancy",
        },
    })

    return (
        <Box maw={700} pt={50} mx="auto">
            <Title order={2} mb={15}>
                Update profile
            </Title>
            {!userProfile || !userProfile.birth || !userProfile.expYears ? (
                <p>
                    Welcome! Please set your profile here to view your life
                    calendar.
                </p>
            ) : null}
            <form onSubmit={form.onSubmit(onSubmitProfileUpdate)}>
                <TextInput
                    withAsterisk
                    disabled
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

                <NumberInput
                    withAsterisk
                    label="Life expectancy (years)"
                    placeholder="80"
                    {...form.getInputProps("expYears")}
                />

                <Group justify="flex-end" mt="md">
                    <Button type="submit" radius="md" w={110}>
                        Submit
                    </Button>
                </Group>
            </form>
        </Box>
    )
}
