import { io } from "socket.io-client";

let socketClient = null;

/**
 * Get or create a socket client connection to the socket server
 * This is used by API routes to emit events
 */
export function getSocketClient() {
    if (socketClient && socketClient.connected) {
        return socketClient;
    }

    const socketUrl = process.env.SOCKET_URL || "http://localhost:3001";
    
    socketClient = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: true,
        timeout: 5000,
    });

    socketClient.on("connect", () => {
        console.log("API Socket client connected to socket server");
    });

    socketClient.on("disconnect", () => {
        console.log("API Socket client disconnected from socket server");
    });

    socketClient.on("connect_error", (error) => {
        console.error("API Socket client connection error:", error);
    });

    return socketClient;
}

/**
 * Emit a new message event to the socket server for broadcasting
 */
export function broadcastNewMessage(message, conversationId, receiverId) {
    const client = getSocketClient();
    if (client && client.connected) {
        client.emit("broadcast_new_message", {
            message,
            conversationId,
            receiverId,
        });
    } else {
        console.warn("Socket client not connected, message will not be broadcasted in real-time");
    }
}

/**
 * Emit a messages read event to the socket server for broadcasting
 */
export function broadcastMessagesRead(conversationId, userId) {
    const client = getSocketClient();
    if (client && client.connected) {
        client.emit("broadcast_messages_read", {
            conversationId,
            userId,
        });
    } else {
        console.warn("Socket client not connected, read status will not be broadcasted in real-time");
    }
}

