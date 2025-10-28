import { ReactNode } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  ModalProps,
  ModalContentProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
} from '@chakra-ui/react';

interface StructuredModalProps extends Pick<ModalProps, 'isOpen' | 'onClose' | 'isCentered' | 'size' | 'closeOnOverlayClick' | 'closeOnEsc' | 'motionPreset'> {
  title?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  isCloseButtonDisabled?: boolean;
  contentProps?: ModalContentProps;
  headerProps?: ModalHeaderProps;
  bodyProps?: ModalBodyProps;
  footerProps?: ModalFooterProps;
}

export default function StructuredModal({
  isOpen,
  onClose,
  isCentered = true,
  size = 'xl',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  motionPreset = 'scale',
  title,
  header,
  footer,
  children,
  showCloseButton = true,
  isCloseButtonDisabled = false,
  contentProps,
  headerProps,
  bodyProps,
  footerProps,
}: StructuredModalProps) {
  const headerContent = header ?? title;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered={isCentered}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEsc={closeOnEsc}
      motionPreset={motionPreset}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        display="flex"
        flexDirection="column"
        maxH="90vh"
        {...contentProps}
      >
        {headerContent && (
          <ModalHeader borderBottomWidth="1px" {...headerProps}>
            {headerContent}
          </ModalHeader>
        )}
        {showCloseButton && (
          <ModalCloseButton isDisabled={isCloseButtonDisabled} />
        )}
        <ModalBody flex="1" overflowY="auto" {...bodyProps}>
          {children}
        </ModalBody>
        {footer && (
          <ModalFooter borderTopWidth="1px" {...footerProps}>
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

