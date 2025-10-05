import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  VStack,
  HStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
// import { useAuth } from '../../lib/auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationBadge() {
  // const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const bg = 'white';
  const borderColor = 'gray.200';

  const loadNotifications = useCallback(async () => {
    if (hasLoaded) return;
    
    setLoading(true);
    try {
      // Mock data - implementar com API real
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Documento Aprovado',
          message: 'Sua carteira de motorista foi aprovada com sucesso.',
          type: 'success',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          id: '2',
          title: 'Pagamento Processado',
          message: 'Seu pagamento de €250.50 foi processado.',
          type: 'info',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          read: false,
        },
        {
          id: '3',
          title: 'Nova Funcionalidade',
          message: 'Confira o novo sistema de documentos na sua conta.',
          type: 'info',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          read: true,
        },
      ];
      
      setNotifications(mockNotifications);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [hasLoaded]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const dismissNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'green.500';
      case 'warning':
        return 'orange.500';
      case 'error':
        return 'red.500';
      default:
        return 'blue.500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notificações"
            icon={<FiBell />}
            variant="ghost"
            colorScheme="gray"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="400px" bg={bg} borderColor={borderColor}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>
          <HStack justify="space-between">
            <Text fontWeight="bold">Notificações</Text>
            {unreadCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0}>
          {loading ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">Carregando...</Text>
            </Box>
          ) : notifications.length === 0 ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">Nenhuma notificação</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  p={3}
                  borderBottomWidth={1}
                  borderBottomColor={borderColor}
                  bg={notification.read ? 'transparent' : 'blue.50'}
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack>
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg={getTypeColor(notification.type)}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight={notification.read ? 'normal' : 'semibold'}
                          noOfLines={1}
                        >
                          {notification.title}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="xs"
                        color="gray.600"
                        noOfLines={2}
                        pl={4}
                      >
                        {notification.message}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        pl={4}
                      >
                        {formatTime(notification.createdAt)}
                      </Text>
                    </VStack>
                    <HStack spacing={1}>
                      {!notification.read && (
                        <IconButton
                          aria-label="Marcar como lida"
                          icon={<FiCheck />}
                          size="xs"
                          variant="ghost"
                          colorScheme="green"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        />
                      )}
                      <IconButton
                        aria-label="Dispensar notificação"
                        icon={<FiX />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                      />
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
