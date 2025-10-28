import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem, Button, Icon } from '@chakra-ui/react';
import { FiSettings, FiChevronDown } from 'react-icons/fi';

export interface PageSettingsItem {
  label: string;
  onClick: () => void;
  icon?: any;
}

interface PageSettingsMenuProps {
  items: PageSettingsItem[];
  label?: string;
}

export default function PageSettingsMenu({ items, label = 'Configurações' }: PageSettingsMenuProps) {
  return (
    <Menu>
      <MenuButton as={Button} size="sm" rightIcon={<FiChevronDown />} leftIcon={<Icon as={FiSettings} />}
        variant="outline" colorScheme="gray">
        {label}
      </MenuButton>
      <MenuList>
        {items.map((item, idx) => (
          <MenuItem key={idx} icon={item.icon ? <Icon as={item.icon} /> : undefined} onClick={item.onClick}>
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

