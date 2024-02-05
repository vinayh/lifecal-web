import { z } from "zod"
import { IconBrandGoogle, IconBrandGithub } from '@tabler/icons-react'
import { useToggle, upperFirst } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import {
    TextInput,
    PasswordInput,
    Text,
    Paper,
    Group,
    PaperProps,
    Button,
    ButtonProps,
    Divider,
    Center,
    Anchor,
    Stack,
} from '@mantine/core';

import { authProvider, authEmailPassword } from "./user"

export default function Login(props: PaperProps) {
    // const [loginOrRegister, toggleLoginOrRegister] = useToggle(['login', 'register']);

    // const valEmailRegex = (email: string): boolean => { return (/^\S+@\S+$/.test(email)) }
    const valEmailZod = (email: string): boolean => { return z.string().email().safeParse(email).success }

    const form = useForm({
        initialValues: { email: "", password: "" },
        validate: {
            email: val => valEmailZod(val) ? null : "Invalid email",
            password: val => (val.length >= 8 ? null : "Password should include at least 8 characters"),
        },
    });

    return (
        <Center pt={25}>
            <Paper radius="md" p="xl" shadow="lg" {...props}>
                <Text size="lg" fw={500}>
                    Welcome to LifeCal, login or register with
                </Text>

                <Group grow mb="md" mt="md">
                    <GoogleButton radius="md" onClick={() => authProvider("google")}>Google</GoogleButton>
                    <GithubButton radius="md" onClick={() => authProvider("github")}>GitHub</GithubButton>
                </Group>

                <Divider label="Or continue with email" labelPosition="center" my="lg" />

                <form onSubmit={form.onSubmit(authEmailPassword)}>
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
                        <Button type="submit" radius="md">Login | Register</Button>
                    </Group>
                </form>
            </Paper>
        </Center>
    )
}

function GoogleButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
    return <Button leftSection={<IconBrandGoogle />} {...props} />
}

function GithubButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
    return <Button leftSection={<IconBrandGithub />} {...props} />
}