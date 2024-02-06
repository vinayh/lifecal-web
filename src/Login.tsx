import { z } from "zod"
import { Dispatch, SetStateAction, useState } from "react"
import { IconBrandGoogle, IconBrandGithub } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import {
    TextInput,
    PasswordInput,
    Text,
    Paper,
    Group,
    Button,
    Box,
    LoadingOverlay,
    ButtonProps,
    Divider,
    Center,
    Stack,
} from '@mantine/core';

import { authProvider, authEmailPassword, UserStatus, LoginFormEntryZ } from "./user"

export default function Login({ userStatus, setUserStatus }: { userStatus: UserStatus, setUserStatus: Dispatch<SetStateAction<UserStatus>> }) {
    // const valEmailRegex = (email: string): boolean => { return (/^\S+@\S+$/.test(email)) }
    const valEmailZod = (email: string): boolean => { return z.string().email().safeParse(email).success }

    const form = useForm({
        initialValues: { email: "", password: "" },
        validate: {
            email: val => valEmailZod(val) ? null : "Invalid email",
            password: val => (val.length >= 8 ? null : "Password should include at least 8 characters"),
        },
    });

    const signIn = async (provider: string, values: z.infer<typeof LoginFormEntryZ> | null = null) => {
        const signInAsync = (() => {
            if (provider === "google") { return authProvider("google") }
            else if (provider === "github") { return authProvider("github") }
            else if (provider === "email" && values !== null) { return authEmailPassword(values) }
            else { throw new Error("Invalid sign in method") }
        })()
        setUserStatus(UserStatus.SigningIn)
        signInAsync
            .then(_ => setUserStatus(UserStatus.SignedIn))
            .catch(_ => setUserStatus(UserStatus.SignInError))
    }

    return (
        <Center pt={25}>
            <Box>
                <Paper radius="md" p="xl" shadow="lg">
                    <Text size="lg" fw={500}>
                        Welcome to LifeCal, login or register with
                    </Text>

                    <Group grow mb="md" mt="md">
                        <GoogleButton radius="md" onClick={() => signIn("google")}>Google</GoogleButton>
                        <GithubButton radius="md" onClick={() => signIn("github")}>GitHub</GithubButton>
                    </Group>

                    <Divider label="Or continue with email" labelPosition="center" my="lg" />

                    <form onSubmit={form.onSubmit(values => signIn("email", values))}>
                        <Stack>
                            <TextInput
                                required
                                label="Email"
                                placeholder="your@email.com"
                                radius="md"
                                {...form.getInputProps("email")}
                            />

                            <PasswordInput
                                required
                                label="Password"
                                placeholder="Your password"
                                radius="md"
                                {...form.getInputProps("password")}
                            />
                        </Stack>

                        <Group justify="flex-end" mt="md">
                            <LoadingOverlay visible={userStatus === UserStatus.SigningIn} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                            <Button type="submit" radius="md">Login | Register</Button>
                        </Group>
                    </form>
                </Paper>
            </Box>
        </Center>
    )
}

function GoogleButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
    return <Button leftSection={<IconBrandGoogle />} {...props} />
}

function GithubButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
    return <Button leftSection={<IconBrandGithub />} {...props} />
}