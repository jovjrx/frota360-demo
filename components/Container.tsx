import { Box, Container as ChakraContainer } from "@chakra-ui/react"

export const Container = ({ children, softBg, maxW = "7xl", bg = "gray.100" }: { children: React.ReactNode, softBg?: boolean, maxW?: string, bg?: string }) => {
    return (
        <Box as="section" py={{ base: 6, md: 12 }} px={{ base: 2, md: 8 }} bg={softBg ? bg : "white"}>
            <ChakraContainer maxW={maxW} p={{ base: 2, md: 4 }}>
                {children}
            </ChakraContainer>
        </Box>
    )
}
