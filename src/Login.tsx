import { z } from "zod"
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react"
import { useForm } from "@mantine/form"
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
    Title,
} from "@mantine/core"

import { AuthStatus, useUserStore } from "./user"

export default function Login() {
    const { login, authStatus } = useUserStore()
    // const valEmailRegex = (email: string): boolean => { return (/^\S+@\S+$/.test(email)) }
    const valEmailZod = (email: string): boolean => { return z.string().email().safeParse(email).success }

    const form = useForm({
        initialValues: { email: "", password: "" },
        validate: {
            email: val => valEmailZod(val) ? null : "Invalid email",
            password: val => (val.length >= 8 ? null : "Password should include at least 8 characters"),
        },
    })

    return (
            <Box maw={500} pt={50} mx="auto">
                <Title order={2}>Login or register</Title>

                <Group grow mb="md" mt="md">
                    <GoogleButton radius="md" onClick={() => login("google", undefined)}>Google</GoogleButton>
                    <GithubButton radius="md" onClick={() => login("github", undefined)}>GitHub</GithubButton>
                </Group>

                <Divider label="Or continue with email" labelPosition="center" my="lg" />

                <form onSubmit={form.onSubmit(values => login("emailPassword", values))}>
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
                        <LoadingOverlay visible={authStatus === AuthStatus.SigningIn} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                        {/* TODO: Change logging in status from AuthStatus.SigningIn as that no longer works, try using something based on login fn */}
                        <Button type="submit" radius="md">Login | Register</Button>
                    </Group>
                </form>
            </Box>
    )
}

function GoogleButton(props: ButtonProps & React.ComponentPropsWithoutRef<"button">) {
    return <Button leftSection={<IconBrandGoogle />} {...props} />
}

function GithubButton(props: ButtonProps & React.ComponentPropsWithoutRef<"button">) {
    return <Button leftSection={<IconBrandGithub />} {...props} />
}