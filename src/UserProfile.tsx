import { useState } from "react";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { TextInput, Button, Group, Text, Paper, Center, Container } from "@mantine/core";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, User, Status } from "./user";
import { StatusNotification } from "./StatusNotification";
import { BACKEND_URL } from "./Dashboard";

export function UserProfile({ user }: { user: User }) {
    const [updateStatus, setUpdateStatus] = useState<Status | null>(null);
    const [updateMessage, setUpdateMessage] = useState<string | null>(null);
    const [authUser, authLoading, authError] = useAuthState(auth);

    const { uid, name, birth, expYears, email } = user

    const updateProfile = (formEntry: { name: string, birth: string | Date, expYears: string | number, email: string }) => {
        setUpdateStatus(Status.Loading);
        setUpdateMessage("Saving profile...");
        const { name, birth, expYears, email } = formEntry;
        console.log(new Date(birth));
        if (!(authUser == null)) {
            authUser.getIdToken()
                .then((idToken: string) => fetch(`${BACKEND_URL}/updateUserProfile?uid=${uid}&idToken=${idToken}&name=${name}&birth=${birth}&expYears=${expYears}&email=${email}`))
                .then(res => {
                    if (res.ok) {
                        setUpdateStatus(Status.Success);
                        setUpdateMessage("Profile updated.");
                    }
                    else {
                        setUpdateStatus(Status.Error);
                        setUpdateMessage("Please try again.");
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
                <form onSubmit={form.onSubmit(updateProfile)}>
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

                    <Group preventGrowOverflow={false} wrap="nowrap" mt="md">
                        <Container w={290} p={0} h={55}>
                            <StatusNotification status={updateStatus} message={updateMessage} />
                        </Container>
                        <Button type="submit" radius="md" w={110}>Submit</Button>
                    </Group>
                </form>
            </Paper>
        </Center>
    );
}
