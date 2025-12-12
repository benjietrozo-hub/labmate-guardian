import { useState, useEffect, useRef } from 'react';

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
};

type WebSocketHook = {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  loadMoreNotifications: () => void;
  hasMoreNotifications: boolean;
  totalNotifications: number;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
};

export const useWebSocket = (userId: string, userRole: string): WebSocketHook => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Load persisted notifications from database
    loadPersistedNotifications();

    // Initialize WebSocket connection
    const wsUrl = `ws://localhost:8081?userId=${userId}&role=${userRole}`;
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
        // Send identification message to server
        ws.current?.send(JSON.stringify({
          type: 'identify',
          userId: userId,
          role: userRole
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          if (data.type === 'notification') {
            const notification = data.payload || data.notification;
            setNotifications(prev => [
              {
                title: notification.title || 'Notification',
                message: notification.message || '',
                timestamp: notification.timestamp || new Date().toISOString(),
                id: notification.id || Date.now().toString(),
                read: false,
                actionUrl: notification.actionUrl
              },
              ...prev
            ]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [userId, userRole]);

  const loadPersistedNotifications = async () => {
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/notifications.php?user_id=${userId}&limit=50`);
      const result = await response.json();
      
      if (result.success) {
        const persistedNotifications = result.data.map((notif: any) => ({
          title: notif.title,
          message: notif.message,
          timestamp: notif.created_at,
          id: notif.id,
          read: notif.read_status,
          actionUrl: notif.action_url
        }));
        setNotifications(persistedNotifications);
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Update local state
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Update database
    try {
      await fetch(`http://localhost/labmate-guardian-main/api/notifications.php?id=${notificationId}&action=mark_read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // Update local state
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Update database
    try {
      await fetch(`http://localhost/labmate-guardian-main/api/notifications.php?user_id=${userId}&action=mark_all_read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const loadMoreNotifications = () => {
    // Placeholder for loading more notifications from server
    console.log('Loading more notifications...');
  };

  const hasMoreNotifications = false; // Placeholder
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
    hasMoreNotifications,
    totalNotifications,
    removeNotification,
    clearAllNotifications
  };
};
