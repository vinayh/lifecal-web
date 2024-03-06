import { Button, Group, Kbd, TagsInput, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import "@mantine/dates/styles.css"

import { newLoading, updateError, updateSuccess } from "./notifications"
import { useUserStore } from "./user"
import { EntryInfo } from "./Calendar"

export const EntryForm = ({ entryInfo }: { entryInfo: EntryInfo }) => {
    const { addUpdateEntry, deleteEntry } = useUserStore()
    const { date, entry } = entryInfo

    const onSubmitEntryUpdate = (formEntry: {
        note: string
        tags: string[]
    }) => {
        form.validate()
        const updateEntry = { ...formEntry, start: date }
        const id = newLoading("Updating entry", "Please wait...")
        addUpdateEntry(updateEntry)
            .then(() => {
                updateSuccess(id, "Entry updated", "Entry has been saved.")
            })
            .catch(error => {
                updateError(id, "Error", "Error editing entry.")
                console.error("Entry update error: " + JSON.stringify(error))
            })
    }

    const onDeleteEntry = () => {
        const id = newLoading("Deleting entry", "Please wait...")
        deleteEntry(date)
            .then(() => {
                updateSuccess(id, "Entry deleted", "Entry has been deleted.")
            })
            .catch(error => {
                updateError(id, "Error", "Error deleting entry.")
                console.error("Entry delete error: " + JSON.stringify(error))
            })
    }

    const form = useForm({
        initialValues: {
            // start: date,
            note: entry && entry.note ? entry.note : "",
            tags: entry && entry.tags ? entry.tags : [],
        },
        validate: {
            // start: value =>
            //     value instanceof Date || ISODateZ.safeParse(value).success
            //         ? null
            //         : "Invalid start date",
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
                {/* <DateInput
                    withAsterisk
                    label="Start date"
                    placeholder="1 January 1984"
                    {...form.getInputProps("start")}
                /> */}
                <TextInput
                    withAsterisk
                    label="Note"
                    placeholder=""
                    {...form.getInputProps("note")}
                />
                <TagsInput
                    label="Tags"
                    placeholder="Select tags"
                    {...form.getInputProps("tags")}
                />
                <Text mt={10} size="xs">
                    Press <Kbd>↵ Enter</Kbd> to select a tag
                </Text>

                <Group justify="space-between" mt="md">
                    <Button type="submit" size="md" radius="md" w={110}>
                        Submit
                    </Button>
                    {entry ? (
                        <Button
                            radius="md"
                            size="xs"
                            variant="filled"
                            color="red"
                            onClick={() => onDeleteEntry()}
                        >
                            Delete
                        </Button>
                    ) : null}
                </Group>
            </form>
        </>
    )
}
