import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  actionUrl?: string;
  read?: boolean;
}

interface WebSocketMessage {
  type: "notification" | "system" | "user_update";
  payload: any;
}

export const useWebSocket = (userId: string, role: string) => {
  // Load notifications from localStorage on initial load
  const loadStoredNotifications = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  };

  const [notifications, setNotifications] = useState<Notification[]>(loadStoredNotifications());
  const [unreadCount, setUnreadCount] = useState(() => {
    // Calculate unread count from stored notifications
    const stored = loadStoredNotifications();
    return stored.filter(n => !n.read).length;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const setNotificationsWithStorage = (updater: (prev: Notification[]) => Notification[]) => {
    setNotifications((prev) => {
      const newNotifications = updater(prev);
      if (typeof window !== "undefined") {
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(newNotifications.slice(0, 50)));
      }
      return newNotifications;
    });
  };

  const setUnreadCountWithStorage = (updater: (prev: number) => number) => {
    setUnreadCount((prev) => {
      const newCount = updater(prev);
      if (typeof window !== "undefined") {
        localStorage.setItem(`unread_count_${userId}`, newCount.toString());
      }
      return newCount;
    });
  };

  const connect = () => {
    console.log("connect() called, current WebSocket state:", wsRef.current?.readyState);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open, returning");
      return;
    }

    try {
      console.log("Creating new WebSocket connection...");
      const ws = new WebSocket("ws://localhost:8081");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Identify the user
        const identifyMessage = {
          type: "identify",
          userId,
          role,
        };
        console.log("Sending identify message:", identifyMessage);
        ws.send(JSON.stringify(identifyMessage));
        console.log("Identify message sent");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          if (data.type === "notification" && data.payload) {
            console.log("Processing notification payload:", data.payload);
            console.log("Notification type:", data.payload.type);
            
            // Handle borrow-specific notifications
            if (data.payload.type === 'borrow_status_update' || data.payload.type === 'admin_borrow_update') {
              console.log("Calling handleBorrowStatusUpdate");
              handleBorrowStatusUpdate(data.payload);
            } else {
              console.log("Calling handleGenericNotification");
              // Handle generic notifications
              handleGenericNotification(data.payload);
            }
          } else {
            console.log("Received non-notification message:", data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const handleBorrowStatusUpdate = (payload: any) => {
    console.log("handleBorrowStatusUpdate called with payload:", payload);
    const { item, new_status, old_status, user_id, borrower_name, quantity } = payload;
    
    // Ensure quantity is a valid number
    const displayQuantity = quantity && quantity > 0 ? quantity : 1;
    
    let title = "";
    let message = "";
    let type: "info" | "success" | "warning" | "error" = "info";
    
    // Determine navigation URL based on user role and notification type
    const getActionUrl = () => {
      // For regular users (students, instructors, teachers)
      if (role !== "admin") {
        if (new_status === "pending" || new_status === "rejected") {
          return "/my-requests"; // Users see their own requests
        } else if (new_status === "approved" || new_status === "borrowed") {
          return "/my-borrows"; // Users see their borrowed items
        } else if (new_status === "returned") {
          return "/my-borrows"; // Returned items also in borrowed items history
        }
      }
      // For admins
      if (new_status === "pending") {
        return "/borrow-requests"; // Admins manage pending requests
      } else {
        return "/borrow-items"; // Admins see borrowed items
      }
    };
    
    switch (new_status) {
      case 'pending':
        title = "🔴 New Borrow Request";
        message = `${borrower_name} wants to borrow ${item} (${quantity}) - Action required!`;
        type = "error"; // Use error type for red flag indicator
        break;
      case 'approved':
        title = "Request Approved";
        message = `Borrow request for ${item} has been approved.`;
        type = "success";
        break;
      case 'rejected':
        title = "Request Rejected";
        message = `Borrow request for ${item} was rejected.`;
        type = "warning";
        break;
      case 'borrowed':
        title = "Item Borrowed";
        message = `${item} has been borrowed.`;
        type = "info";
        break;
      case 'returned':
        title = "Item Returned";
        message = `${item} has been returned.`;
        type = "success";
        break;
    }
    
    const notification: Notification = {
      id: `borrow-${payload.borrow_id || payload.request_id}-${Date.now()}`,
      title,
      message,
      type,
      timestamp: payload.timestamp || new Date().toISOString(),
      actionUrl: getActionUrl(),
    };

    setNotificationsWithStorage((prev) => [notification, ...prev].slice(0, 50));
    setUnreadCountWithStorage((prev) => prev + 1);

    const actionUrl = getActionUrl();
    toast[type](title, {
      description: message,
      duration: type === "error" ? 8000 : 5000, // Show longer for urgent notifications
      action: {
        label: "View",
        onClick: () => {
          window.location.href = actionUrl;
        },
      },
    });
  };

  const handleGenericNotification = (payload: any) => {
    // Determine appropriate action URL based on notification content or type
    let actionUrl = payload.actionUrl;
    
    // Auto-determine action URL if not provided
    if (!actionUrl) {
      if (payload.title?.toLowerCase().includes('borrow') || payload.message?.toLowerCase().includes('borrow')) {
        // For borrow-related notifications, consider user role
        if (role !== "admin") {
          actionUrl = payload.title?.toLowerCase().includes('request') ? "/my-requests" : "/my-borrows";
        } else {
          actionUrl = payload.title?.toLowerCase().includes('request') ? "/borrow-requests" : "/borrow-items";
        }
      } else if (payload.title?.toLowerCase().includes('incident')) {
        actionUrl = "/incidents";
      } else if (payload.title?.toLowerCase().includes('lost') || payload.title?.toLowerCase().includes('found')) {
        actionUrl = "/lost-found";
      } else if (payload.title?.toLowerCase().includes('repair') || payload.title?.toLowerCase().includes('maintenance')) {
        actionUrl = "/repairs";
      } else if (payload.title?.toLowerCase().includes('visitor')) {
        actionUrl = role !== "admin" ? "/" : "/visitors"; // Regular users go to dashboard
      } else if (payload.title?.toLowerCase().includes('inventory')) {
        actionUrl = role !== "admin" ? "/" : "/inventory"; // Regular users go to dashboard
      } else {
        actionUrl = "/"; // Default to dashboard
      }
    }
    
    const notification: Notification = {
      id: payload.id || Date.now().toString(),
      title: payload.title || "Notification",
      message: payload.message || "",
      type: payload.type || "info",
      timestamp: payload.timestamp || new Date().toISOString(),
      actionUrl,
    };

    setNotificationsWithStorage((prev) => [notification, ...prev].slice(0, 50));
    setUnreadCountWithStorage((prev) => prev + 1);

    // Show toast notification for real-time alerts
    if (payload.showToast !== false) {
      toast[notification.type](notification.title, {
        description: notification.message,
        action: actionUrl ? {
          label: "View",
          onClick: () => {
            window.location.href = actionUrl;
          },
        } : undefined,
      });
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const markAsRead = (notificationId: string) => {
    setNotificationsWithStorage((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCountWithStorage((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotificationsWithStorage((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCountWithStorage(() => 0);
  };

  const loadMoreNotifications = () => {
    if (isLoadingMore || !hasMoreNotifications) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading more notifications (in a real app, this would be an API call)
    setTimeout(() => {
      // For demo purposes, we'll just set hasMoreNotifications to false
      // In a real implementation, you would fetch more notifications from your backend
      setHasMoreNotifications(false);
      setIsLoadingMore(false);
    }, 1000);
  };

  // Update total notifications count
  useEffect(() => {
    setTotalNotifications(notifications.length);
    setHasMoreNotifications(notifications.length >= 50); // If we have 50+ notifications, there might be more
  }, [notifications]);

  const clearAllNotifications = () => {
    setNotificationsWithStorage(() => []);
    setUnreadCountWithStorage(() => 0);
  };

  const removeNotification = (id: string) => {
    setNotificationsWithStorage((prev) => prev.filter((notif) => notif.id !== id));
    // Update unread count if the removed notification was unread
    const removedNotification = notifications.find(n => n.id === id);
    if (removedNotification && !removedNotification.read) {
      setUnreadCountWithStorage((prev) => Math.max(0, prev - 1));
    }
  };

  const sendNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "notification",
          payload: {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  };

  useEffect(() => {
    console.log("useWebSocket useEffect triggered with userId:", userId, "role:", role);
    if (userId && role) {
      console.log("Calling connect()...");
      connect();
    } else {
      console.log("Not connecting - missing userId or role");
    }

    return () => {
      disconnect();
    };
  }, [userId, role]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    sendNotification,
    loadMoreNotifications,
    hasMoreNotifications,
    totalNotifications,
    isLoadingMore,
    removeNotification,
    clearAllNotifications,
  };
};
