import { Box, Title } from "@mantine/core"

export const NotFound404 = () => (
    <Box maw={700} pt={50} mx="auto">
        <Title order={2} mb={15}>
            Page not found
        </Title>
        Unfortunately, that page cannot be found. Please try visiting another
        page in the toolbar.
    </Box>
)
