import { ReactNode } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';

export interface TabConfig {
  key: string;
  label: string;
  content: ReactNode;
}

export interface GlobalTabsProps {
  tabs: TabConfig[];
  defaultIndex?: number;
  isLazy?: boolean;
  simple?: boolean;
}

export function GlobalTabs({
  tabs,
  defaultIndex,
  isLazy = true,
  simple = false
}: GlobalTabsProps) {
  return (
    <Box bg={simple ? 'transparent' : 'white'} borderRadius="lg" shadow={simple ? 'none' : 'sm'} borderWidth={simple ? '0' : '1px'} borderColor="gray.200" overflow="hidden">
      <Tabs isLazy={isLazy} defaultIndex={defaultIndex} variant={'soft-rounded'} colorScheme={'brand'}>
        <TabList px={simple ? 0 : 6} pt={simple ? 0 : 4}>
          {tabs.map((tab) => (
            <Tab key={tab.key} px={4} py={2}>{tab.label}</Tab>
          ))}
        </TabList>

        <TabPanels pt={4}>
          {tabs.map((tab) => (
            <TabPanel key={tab.key} p={simple ? 0 : 6}>
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
}

