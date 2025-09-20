import React, { useEffect, useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  IconButton,
  Badge,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { dashboardAPI, Notification } from '@/lib/api/dashboard';
import { useAuth } from '@/lib/auth';

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
    }
  }, [user?.uid]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const notifs = await dashboardAPI.getNotifications(user.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await dashboardAPI.markNotificationAsRead(user.uid, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: Date.now() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(n => dashboardAPI.markNotificationAsRead(user.uid, n.id))
      );
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: Date.now() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return date.toLocaleDateString('pt-PT');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return '🔄';
      case 'document_approved':
        return '✅';
      case 'earnings_update':
        return '💰';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'blue';
      case 'document_approved':
        return 'green';
      case 'earnings_update':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Popover>
      <PopoverTrigger>
        <IconButton
          icon={<FiBell />}
          variant="ghost"
          size="sm"
          aria-label="Notificações"
          position="relative"
        >
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              borderRadius="full"
              colorScheme="red"
              fontSize="xs"
              minW="16px"
              h="16px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </IconButton>
      </PopoverTrigger>
      <PopoverContent w="400px" maxH="500px" bg="white" borderColor="gray.200">
        <PopoverHeader>
          <HStack justify="space-between" align="center">
            <Text fontWeight="semibold">Notificações</Text>
            {unreadCount > 0 && (
              <Button size="xs" variant="ghost" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody p={0}>
          {loading ? (
            <Box p={4} textAlign="center">
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500" mt={2}>
                Carregando notificações...
              </Text>
            </Box>
          ) : notifications.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                Nenhuma notificação
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <Box
                    p={4}
                    _hover={{ bg: 'gray.50' }}
                    cursor="pointer"
                    position="relative"
                    bg={!notification.read ? 'blue.50' : 'transparent'}
                    borderLeft={!notification.read ? '3px solid' : 'none'}
                    borderLeftColor="blue.500"
                  >
                    <HStack spacing={3} align="start">
                      <Text fontSize="lg">{getNotificationIcon(notification.type)}</Text>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {notification.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600" lineHeight="1.4">
                          {notification.message}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {formatDate(notification.createdAt)}
                        </Text>
                      </VStack>
                      {!notification.read && (
                        <IconButton
                          icon={<FiCheck />}
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          aria-label="Marcar como lida"
                        />
                      )}
                    </HStack>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
