import React from 'react';
import {
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  helpText: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, helpText }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(val || 0);
  };

  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel fontSize="xs">{label}</StatLabel>
          <StatNumber fontSize="lg" color={color}>{formatCurrency(value)}</StatNumber>
          <StatHelpText fontSize="xs">{helpText}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};

export default StatCard;

