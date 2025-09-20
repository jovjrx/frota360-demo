import { Grid } from "@chakra-ui/react"

export const ContainerDivisions = ({ children, columns = 2,
    template,
    align = "stretch", justify = "space-between", gap = { base: 8, lg: 6 } }:
    {
        children: React.ReactNode,
        columns?: number,
        template?: any,
        align?: string,
        justify?: string,
        gap?: any
    }) => {
    return (
        <Grid flex={1} minW="full" minH="100%" templateColumns={template || { base: "1fr", lg: `repeat(${columns}, 1fr)` }}
            gap={gap}
            justifyContent={justify}
            alignItems={align}
        >
            {children}
        </Grid>
    )
}
