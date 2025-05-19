import { useEffect, useState, useRef, useCallback } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 1000; // Start with 1 second

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      };

      ws.current.onmessage = (event) => {
        try {
          const receivedData = JSON.parse(event.data);
          setData(receivedData);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Try to reconnect with exponential backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        } else {
          console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url]);

  // Connect on component mount and url change
  useEffect(() => {
    connect();
    
    // Cleanup function
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, url]);

  // For manually sending messages
  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  };

  return { data, isConnected, sendMessage };
};

export default useWebSocket;