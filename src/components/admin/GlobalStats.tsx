import React from 'react';
import { Grid, GridItem, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, Icon } from '@chakra-ui/react';

export interface GlobalStatItem {
  label: string;
  value: number;
  helpText: string;
  icon: React.ComponentType<any>;
  color?: string;
}

interface GlobalStatsProps {
  items: GlobalStatItem[];
}

export default function GlobalStats({ items }: GlobalStatsProps) {
  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
      {items.map((item, idx) => (
        <GridItem key={idx}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel display="flex" alignItems="center">
                  <Icon as={item.icon} mr={2} />
                  {item.label}
                </StatLabel>
                <StatNumber color={item.color}>{item.value}</StatNumber>
                <StatHelpText>{item.helpText}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      ))}
    </Grid>
  );
}

