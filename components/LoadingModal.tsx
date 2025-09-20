import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Spinner,
} from '@chakra-ui/react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingModal({ isOpen }: LoadingModalProps) {

  return (
    <Modal isOpen={isOpen} onClose={() => { }} closeOnOverlayClick={false} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor={'brand.500'}
          color="brand.500"
          size="xl"
        />
      </ModalContent>
    </Modal>
  );
}
