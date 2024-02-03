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
    Checkbox,
    Anchor,
    Stack,
} from '@mantine/core';

import { authProvider, authEmailPassword } from "./user"

export default function Login(props: PaperProps) {
    const [loginOrRegister, toggleLoginOrRegister] = useToggle(['login', 'register']);
    const form = useForm({
        initialValues: {email: "", name: "", password: ""},
        validate: {
            email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
            password: (val) => (val.length <= 8 ? 'Password should include at least 8 characters' : null),
        },
    });

    return (
        <Paper radius="md" p="xl" withBorder {...props}>
            <Text size="lg" fw={500}>
                Welcome to LifeCal, {loginOrRegister} with
            </Text>

            <Group grow mb="md" mt="md">
                <GoogleButton radius="xl" onClick={() => authProvider("google")}>Google</GoogleButton>
                <GithubButton radius="xl" onClick={() => authProvider("github")}>GitHub</GithubButton>
            </Group>

            <Divider label="Or continue with email" labelPosition="center" my="lg" />

            <form onSubmit={form.onSubmit(e => authEmailPassword(e))}>
                <Stack>
                    {loginOrRegister === 'register' && (
                        <TextInput
                            label="Name"
                            placeholder="Your name"
                            value={form.values.name}
                            onChange={(event) => form.setFieldValue('name', event.currentTarget.value)}
                            radius="md"
                        />
                    )}

                    <TextInput
                        required
                        label="Email"
                        placeholder="hello@mantine.dev"
                        value={form.values.email}
                        onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
                        error={form.errors.email && 'Invalid email'}
                        radius="md"
                    />

                    <PasswordInput
                        required
                        label="Password"
                        placeholder="Your password"
                        value={form.values.password}
                        onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
                        error={form.errors.password && 'Password should include at least 8 characters'}
                        radius="md"
                    />

                    {/* {loginOrRegister === 'register' && (
                        <Checkbox
                            label="I accept terms and conditions"
                            checked={form.values.terms}
                            onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
                        />
                    )} */}
                </Stack>

                <Group justify="space-between" mt="xl">
                    <Anchor component="button" type="button" c="dimmed" onClick={() => toggleLoginOrRegister()} size="xs">
                        {loginOrRegister === 'register'
                            ? 'Already have an account? Login'
                            : "Don't have an account? Register"}
                    </Anchor>
                    <Button type="submit" radius="xl">
                        {upperFirst(loginOrRegister)}
                    </Button>
                </Group>
            </form>
        </Paper>
    );
}

function GoogleButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
    return <Button leftSection={<IconBrandGoogle color="var(--mantine-color-blue-filled)" />} variant="default" {...props} />
}

function GithubButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return <Button leftSection={<IconBrandGithub color="var(--mantine-color-blue-filled)" />} variant="default" {...props} />
}