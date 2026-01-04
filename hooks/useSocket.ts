"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (userId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Socket server URL - adjust if your socket server runs on different port
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    
    // Create socket connection
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      // Suppress connection errors if server is not available
      timeout: 5000,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      
      // Join user room
      if (userId) {
        newSocket.emit("join_user_room", userId);
        console.log("Joining user room for userId:", userId);
      }
    });

    newSocket.on("connected", (data) => {
      console.log("✅ Joined user room:", data);
    });

    newSocket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected - will attempt to reconnect");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      // Only log error, don't show to user - socket server might not be running
      console.warn("Socket connection error (socket server may not be running):", error.message);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.warn("Socket error (socket server may not be running):", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.emit("leave_user_room", userId);
        newSocket.disconnect();
      }
    };
  }, [userId]);

  return { socket, isConnected };
};

