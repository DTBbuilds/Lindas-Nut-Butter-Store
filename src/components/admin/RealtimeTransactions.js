import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faTimesCircle, faSpinner, 
  faBell, faBellSlash, faMoneyBill, faSync
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Use direct API URL definition instead of importing from config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * RealtimeTransactions Component
 * 
 * Uses polling to fetch recent transactions and display notifications
 * Provides a way to refresh transaction list when new transactions arrive
 */
const RealtimeTransactions = ({ onNewTransaction }) => {
  const [polling, setPolling] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(10000); // 10 seconds
  const notificationsRef = useRef([]);
  const timerRef = useRef(null);
  
  // Set up polling for transactions
  useEffect(() => {
    // Start polling
    console.log('Setting up transaction polling at interval:', pollingInterval);
    setPolling(true);
    setConnected(true);
    
    // Initial fetch
    fetchRecentTransactions();
    
    // Set up interval for polling
    timerRef.current = setInterval(() => {
      if (notificationsEnabled) {
        fetchRecentTransactions();
      }
    }, pollingInterval);
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setPolling(false);
      setConnected(false);
    };
  }, [notificationsEnabled, pollingInterval]);
  
  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/api/admin/dashboard/realtime-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update connection status on successful API call
      setConnected(true);
      
      const transactions = response.data.data || [];
      
      // If no transactions are returned, don't process further
      if (!transactions || transactions.length === 0) {
        return;
      }
      
      if (transactions.length > 0) {
        // Process new transactions (ones we haven't seen before)
        const latestTransaction = transactions[0];
        
        if (lastTransactionId !== latestTransaction._id) {
          // We have a new transaction
          console.log('New transaction detected:', latestTransaction);
          setLastTransactionId(latestTransaction._id);
          
          // Generate notification based on status
          if (latestTransaction.status === 'COMPLETED') {
            handleNewNotification({
              type: 'completed',
              title: 'Payment Completed',
              message: `Payment of KES ${latestTransaction.amount} completed successfully`,
              timestamp: new Date(latestTransaction.timestamp),
              transaction: latestTransaction
            });
            
            // Call the callback if provided
            if (onNewTransaction) {
              onNewTransaction(latestTransaction, 'completed');
            }
          } else if (latestTransaction.status === 'FAILED') {
            handleNewNotification({
              type: 'failed',
              title: 'Payment Failed',
              message: `Payment of KES ${latestTransaction.amount} failed`,
              timestamp: new Date(latestTransaction.timestamp),
              transaction: latestTransaction
            });
            
            // Call the callback if provided
            if (onNewTransaction) {
              onNewTransaction(latestTransaction, 'failed');
            }
          } else if (latestTransaction.status === 'PENDING') {
            handleNewNotification({
              type: 'created',
              title: 'New Transaction',
              message: `New pending transaction of KES ${latestTransaction.amount} initiated`,
              timestamp: new Date(latestTransaction.timestamp),
              transaction: latestTransaction
            });
            
            // Call the callback if provided
            if (onNewTransaction) {
              onNewTransaction(latestTransaction, 'created');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setConnected(false);
      
      // Handle 404 error specifically
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint for realtime transactions not found. This feature may not be available.');
      } else if (error.response && error.response.status === 500) {
        // Increase polling interval to reduce server load
        setPollingInterval(prev => Math.min(prev * 2, 60000)); // Max 1 minute
      }
    }
  };
  
  // Handle new notification
  const handleNewNotification = (notification) => {
    // Add notification to state with a unique ID
    const newNotification = {
      ...notification,
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      read: false
    };
    
    // Update refs and state
    notificationsRef.current = [newNotification, ...notificationsRef.current].slice(0, 50);
    setNotifications(notificationsRef.current);
    
    // Call the onNewTransaction callback if provided
    if (onNewTransaction && typeof onNewTransaction === 'function') {
      onNewTransaction(notification.transaction, notification.type);
    }
    
    // Play notification sound if enabled
    if (notificationsEnabled) {
      playNotificationSound(notification.type);
    }
    
    // Show browser notification if enabled
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const icon = getNotificationIcon(notification.type);
      new Notification(notification.title, {
        body: notification.message,
        icon: icon
      });
    }
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      dismissNotification(newNotification.id);
    }, 10000);
  };
  
  // Play notification sound based on type
  const playNotificationSound = (type) => {
    let soundFile;
    
    switch (type) {
      case 'completed':
        soundFile = '/sounds/transaction-success.mp3';
        break;
      case 'failed':
        soundFile = '/sounds/transaction-failed.mp3';
        break;
      default:
        soundFile = '/sounds/notification.mp3';
        break;
    }
    
    // Try to play the sound
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'completed':
        return '/icons/payment-success.png';
      case 'failed':
        return '/icons/payment-failed.png';
      default:
        return '/favicon.ico';
    }
  };
  
  // Dismiss notification
  const dismissNotification = (id) => {
    notificationsRef.current = notificationsRef.current.filter(n => n.id !== id);
    setNotifications(notificationsRef.current);
  };
  
  // Toggle notifications
  const toggleNotifications = () => {
    // Request permission if not granted yet
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  // Get icon and color based on polling status
  const getConnectionStatusIcon = () => {
    if (polling) {
      return <FontAwesomeIcon icon={faSync} className="text-green-500" />;
    } else {
      return <FontAwesomeIcon icon={faSpinner} spin className="text-yellow-500" />;
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'created':
        return 'bg-blue-100 border-blue-500';
      case 'updated':
        return 'bg-yellow-100 border-yellow-500';
      case 'completed':
        return 'bg-green-100 border-green-500';
      case 'failed':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };
  
  // Get notification icon based on type
  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'created':
        return <FontAwesomeIcon icon={faMoneyBill} className="text-blue-500" />;
      case 'updated':
        return <FontAwesomeIcon icon={faSpinner} className="text-yellow-500" />;
      case 'completed':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'failed':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="text-gray-500" />;
    }
  };
  
  return (
    <div className="realtime-transactions">
      {/* Connection status indicator */}
      <div className="flex items-center mb-2">
        <div className="mr-2 flex items-center">
          <span className="mr-1">Status:</span>
          {getConnectionStatusIcon()}
          <span className="ml-1 text-sm">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        
        <button
          onClick={toggleNotifications}
          className={`ml-auto flex items-center px-2 py-1 rounded-md text-sm ${
            notificationsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <FontAwesomeIcon
            icon={notificationsEnabled ? faBell : faBellSlash}
            className="mr-1"
          />
          {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
        </button>
      </div>
      
      {/* Notifications list */}
      <div className="notifications-list max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-gray-500 text-center py-4 text-sm">
            No new transaction notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification p-3 mb-2 rounded-md border-l-4 relative ${getNotificationColor(
                notification.type
              )}`}
            >
              <button
                onClick={() => dismissNotification(notification.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getNotificationTypeIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RealtimeTransactions;
