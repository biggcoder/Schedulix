import { useEffect, useRef, useState, useCallback } from 'react';

const useWebSocket = (url) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      // Send a ping message to keep the connection alive
      ws.current.send('ping');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      reconnectTimeout.current = setTimeout(connect, 5000);
    };
  }, [url]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { ws: ws.current, isConnected };
};

export default useWebSocket; 