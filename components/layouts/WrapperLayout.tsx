import { Container } from "@chakra-ui/react"

export const WrapperLayout: React.FC<{ children: React.ReactNode, panel?: boolean, maxW?: string, py?: number | { base: number, md: number }, px?: number | { base: number, md: number } }> = ({ children, panel, maxW, py, px }) => {
    return <Container maxW={panel ? 'full' : maxW || '8xl'} py={py || { base: 0, md: 1 }} px={px || { base: 2, md: 4 }}>{children} </Container>
}