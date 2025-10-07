import { Container } from "@chakra-ui/react"

export const WrapperLayout: React.FC<{ children: React.ReactNode, py?: number | { base: number, md: number }, px?: number | { base: number, md: number } }> = ({ children, py, px }) => {
    return <Container maxW="full" py={py || { base: 0, md: 1 }} px={px || { base: 2, md: 4 }}>{children} </Container>
}