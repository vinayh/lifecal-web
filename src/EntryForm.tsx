import { Button, Group, Kbd, TagsInput, Text, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import "@mantine/dates/styles.css"

import { newLoading, updateError, updateSuccess } from "./notifications"
import { EntryFormData, ISODateZ, useUserStore } from "./user"
import { EntryInfo } from "./Calendar"

export const EntryForm = ({ entryInfo }: { entryInfo: EntryInfo }) => {
    const { addUpdateEntry } = useUserStore()
    const { date, entry } = entryInfo

    const onSubmitEntryUpdate = (formEntry: EntryFormData) => {
        form.validate()
        const id = newLoading("Updating entry", "Please wait...")
        addUpdateEntry(formEntry)
            .then(() => {
                console.log("Success received")
                updateSuccess(id, "Entry updated", "Entry has been saved.")
            })
            .catch(error => {
                updateError(id, "Error", "Error editing entry.")
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
            <Text size="md" mb={15}>
                Date: {date}
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
                <Text mt={10} size="xs">
                    Press <Kbd>↵ Enter</Kbd> to select a tag
                </Text>

                <Group justify="flex-end" mt="md">
                    <Button type="submit" radius="md" w={110}>
                        Submit
                    </Button>
                </Group>
            </form>
        </>
    )
}
