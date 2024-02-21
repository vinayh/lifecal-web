import { Button, Group, TagsInput, Text, TextInput, rem } from "@mantine/core"
import { IconCheck, IconX } from "@tabler/icons-react"
import { notifications } from "@mantine/notifications"
import { useForm } from "@mantine/form"
import { DateInput } from "@mantine/dates"
import "@mantine/dates/styles.css"

import { EntryFormData, ISODateZ, useUserStore } from "./user"
import { EntryInfo } from "./Calendar"

export const EntryForm = ({ entryInfo }: { entryInfo: EntryInfo }) => {
    const { addUpdateEntry } = useUserStore()
    const { date, entry } = entryInfo

    const onSubmitEntryUpdate = (formEntry: EntryFormData) => {
        form.validate()
        const id = notifications.show({
            loading: true,
            title: "Updating entry",
            message: "Please wait...",
            autoClose: false,
            withCloseButton: false,
        })
        addUpdateEntry(formEntry)
            .then(() => {
                console.log("Success received")
                notifications.update({
                    id,
                    color: "teal",
                    title: "Entry updated",
                    message: "Entry has been saved.",
                    icon: (
                        <IconCheck
                            style={{ width: rem(18), height: rem(18) }}
                        />
                    ),
                    loading: false,
                    autoClose: 3000,
                })
            })
            .catch(error => {
                notifications.update({
                    id,
                    color: "red",
                    title: "Error",
                    message: "Error editing entry.",
                    icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
                    loading: false,
                    autoClose: 3000,
                })
                console.error("Entry update error: " + JSON.stringify(error))
            })
    }

    const form = useForm({
        initialValues: {
            start: new Date(date),
            note: entry && entry.note ? entry.note : "",
            tags: entry && entry.tags ? entry.tags : [],
        },
        validate: {
            start: value =>
                value instanceof Date || ISODateZ.safeParse(value).success
                    ? null
                    : "Invalid start date",
            note: value => (value ? null : "Invalid note"),
            // tags: value => (value !== undefined && value.length >= 1) ? null : "Invalid tags",
        },
    })

    return (
        <>
            <Text size="lg" fw={500}>
                Entry starting {date}
            </Text>
            <form onSubmit={form.onSubmit(onSubmitEntryUpdate)}>
                <DateInput
                    withAsterisk
                    label="Start date"
                    placeholder="1 January 1984"
                    {...form.getInputProps("start")}
                />

                <TextInput
                    withAsterisk
                    label="Note"
                    placeholder=""
                    {...form.getInputProps("note")}
                />

                {/* <TextInput
                withAsterisk
                label="Tags"
                placeholder=""
                {...form.getInputProps("tags")} /> */}
                {/* TODO: Change tags entry to select list of available tags or add new tag */}

                <TagsInput
                    label="Tags"
                    placeholder="Select tags"
                    {...form.getInputProps("tags")}
                />

                <Group justify="flex-end" mt="md">
                    <Button type="submit" radius="md" w={110}>
                        Submit
                    </Button>
                </Group>
            </form>
        </>
    )
}
