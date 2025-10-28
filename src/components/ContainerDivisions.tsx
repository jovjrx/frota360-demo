import { useMemo, type ReactNode } from "react";
import { Grid, type GridProps } from "@chakra-ui/react";

type TemplateProp = GridProps["templateColumns"];

interface ContainerDivisionsProps {
    children: ReactNode;
    columns?: number;
    template?: TemplateProp;
    align?: GridProps["alignItems"];
    justify?: GridProps["justifyContent"];
    gap?: GridProps["gap"];
}

const sanitizeTemplateString = (input: string, columns: number) => {
    if (!input) return input;
    const replaced = input.replace(/repeatPage\s*\(/gi, "repeat(");
    if (/repeat\(/i.test(replaced)) {
        return replaced.replace(/repeat\((\d+)\s*,\s*1fr\)/gi, (_match, count) => `repeat(${count}, minmax(0, 1fr))`);
    }
    return replaced;
};

const normalizeTemplateValue = (value: TemplateProp, columns: number): TemplateProp => {
    if (typeof value === "string") {
        return sanitizeTemplateString(value, columns);
    }

    if (typeof value === "number") {
        return `repeat(${value}, minmax(0, 1fr))`;
    }

    if (Array.isArray(value)) {
        return value.map((item) => normalizeTemplateValue(item as TemplateProp, columns)) as TemplateProp;
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, normalizeTemplateValue(item as TemplateProp, columns)])
        ) as TemplateProp;
    }

    return value ?? undefined;
};

const buildTemplate = (template: TemplateProp | undefined, columns: number): TemplateProp => {
    if (!template) {
        return { base: "1fr", lg: `repeat(${columns}, minmax(0, 1fr))` };
    }

    return normalizeTemplateValue(template, columns);
};

export const ContainerDivisions = ({
    children,
    columns = 2,
    template,
    align = "stretch",
    justify = "space-between",
    gap = { base: 8, lg: 6 },
}: ContainerDivisionsProps) => {
    const templateColumns = useMemo(() => buildTemplate(template, columns), [template, columns]);

    return (
        <Grid
            flex={1}
            minW="full"
            minH="100%"
            templateColumns={templateColumns}
            gap={gap}
            justifyContent={justify}
            alignItems={align}
        >
            {children}
        </Grid>
    );
};

