import { useEffect, useState, useRef } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Only try to connect in a browser environment
    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      try {
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const receivedData = JSON.parse(event.data);
            setData(receivedData);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    } else {
      console.warn('WebSocket not supported in this environment');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected.');
    }
  };

  return { data, isConnected, sendMessage };
};

export default useWebSocket;