import { Box, Container as ChakraContainer } from "@chakra-ui/react"
import { WrapperLayout } from "./layouts/WrapperLayout"

export const Container = ({ children, softBg, maxW = "8xl", bg = "gray.100" }: { children: React.ReactNode, softBg?: boolean, maxW?: string, bg?: string }) => {
    return (
        <Box as="section" py={{ base: 6, md: 12 }} bg={softBg ? bg : "white"}>
            <WrapperLayout px={{ base: 2, md: 4 }} maxW={maxW}>
                {children}
            </WrapperLayout>
        </Box>
    )
}
