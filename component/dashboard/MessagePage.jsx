"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Video, Paperclip, Smile, X, MessageCircle } from "lucide-react";
import { Button } from "@/component/ui/button";
import { Card } from "@/component/ui/card";
import { Input } from "@/component/ui/input";
import { cn } from "@/lib/utils";
import io from "socket.io-client";

export function MessagePage() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        // Get current user ID from localStorage or session
        const userId = localStorage.getItem("userId");
        setCurrentUserId(userId);

        if (!userId) {
            console.error("User not logged in");
            return;
        }

        // Connect to socket server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const newSocket = io(socketUrl, {
            auth: {
                userId: userId,
            },
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            console.log("Connected to socket server");
            setIsConnected(true);
            // Join user's room
            newSocket.emit("join_user_room", userId);
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from socket server");
            setIsConnected(false);
        });

        newSocket.on("new_message", (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on("message_sent", (message) => {
            setMessages((prev) => {
                // Update message status if it's a pending message
                const updated = prev.map((msg) =>
                    msg.tempId === message.tempId
                        ? { ...msg, id: message.id, status: "sent", tempId: undefined }
                        : msg
                );
                // If message not found in pending, add it
                if (!updated.find((m) => m.id === message.id)) {
                    return [...updated, message];
                }
                return updated;
            });
            scrollToBottom();
        });

        newSocket.on("message_error", (error) => {
            console.error("Message error:", error);
            // Update message status to failed
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.tempId === error.tempId
                        ? { ...msg, status: "failed" }
                        : msg
                )
            );
        });

        setSocket(newSocket);

        // Load conversations
        loadConversations(userId);

        return () => {
            newSocket.close();
        };
    }, []);

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation && socket) {
            loadMessages(selectedConversation.id);
            // Join conversation room
            socket.emit("join_conversation", selectedConversation.id);
        }
    }, [selectedConversation, socket]);

    const loadConversations = async (userId) => {
        try {
            const response = await fetch(`/api/messages/conversations?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await fetch(`/api/messages?conversationId=${conversationId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                scrollToBottom();
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async (text, type = "text", fileUrl = null) => {
        if (!selectedConversation || !socket || !text.trim() && !fileUrl) return;

        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const messageData = {
            tempId,
            conversationId: selectedConversation.id,
            senderId: currentUserId,
            receiverId: selectedConversation.otherUserId,
            content: text,
            type,
            fileUrl,
            status: "sending",
            createdAt: new Date().toISOString(),
        };

        // Optimistically add message
        setMessages((prev) => [...prev, messageData]);
        scrollToBottom();

        // Send via socket
        socket.emit("send_message", messageData);

        // Also send via HTTP as fallback
        try {
            const formData = new FormData();
            formData.append("conversationId", selectedConversation.id);
            formData.append("senderId", currentUserId);
            formData.append("receiverId", selectedConversation.otherUserId);
            formData.append("content", text || "");
            formData.append("type", type);
            if (fileUrl) {
                formData.append("fileUrl", fileUrl);
            }

            const response = await fetch("/api/messages", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.tempId === tempId ? { ...msg, status: "failed" } : msg
                )
            );
        }

        setNewMessage("");
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage.trim(), "text");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);

        try {
            // Upload file to S3 or your storage
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", file.type.startsWith("image/") ? "image" : "video");

            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                const fileType = file.type.startsWith("image/") ? "image" : "video";
                sendMessage(file.name, fileType, uploadData.url);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="h-full w-full flex overflow-hidden bg-gray-50">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    <div className={cn(
                        "mt-2 text-xs",
                        isConnected ? "text-green-600" : "text-red-600"
                    )}>
                        {isConnected ? "● Connected" : "● Disconnected"}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <p>No conversations yet</p>
                            <p className="text-sm mt-2">Start chatting with someone!</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={cn(
                                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                                    selectedConversation?.id === conv.id && "bg-blue-50 border-l-4 border-l-blue-500"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                                        {conv.otherUserName?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-800 truncate">
                                            {conv.otherUserName || "Unknown User"}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate">
                                            {conv.lastMessage?.content || "No messages yet"}
                                        </div>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                                    {selectedConversation.otherUserName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-800">
                                        {selectedConversation.otherUserName || "Unknown User"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {isConnected ? "Online" : "Offline"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((message) => {
                                    const isOwn = message.senderId === currentUserId;
                                    return (
                                        <div
                                            key={message.id || message.tempId}
                                            className={cn(
                                                "flex",
                                                isOwn ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[70%] rounded-lg p-3",
                                                    isOwn
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-white text-gray-800 border border-gray-200"
                                                )}
                                            >
                                                {message.type === "image" && message.fileUrl && (
                                                    <img
                                                        src={message.fileUrl}
                                                        alt="Shared image"
                                                        className="max-w-full rounded mb-2"
                                                        onError={(e) => {
                                                            e.target.src = "/placeholder-image.png";
                                                        }}
                                                    />
                                                )}
                                                {message.type === "video" && message.fileUrl && (
                                                    <video
                                                        src={message.fileUrl}
                                                        controls
                                                        className="max-w-full rounded mb-2"
                                                    />
                                                )}
                                                {message.content && (
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                )}
                                                <div className={cn(
                                                    "text-xs mt-1 flex items-center gap-1",
                                                    isOwn ? "text-blue-100" : "text-gray-500"
                                                )}>
                                                    <span>{formatTime(message.createdAt)}</span>
                                                    {isOwn && (
                                                        <span>
                                                            {message.status === "sending" && "⏳"}
                                                            {message.status === "sent" && "✓"}
                                                            {message.status === "failed" && "✗"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingFile}
                                    className="flex-shrink-0"
                                >
                                    {uploadingFile ? (
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                    ) : (
                                        <Paperclip className="w-5 h-5" />
                                    )}
                                </Button>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                    disabled={uploadingFile}
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || uploadingFile}
                                    className="flex-shrink-0 bg-blue-500 hover:bg-blue-600"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-semibold">Select a conversation</p>
                            <p className="text-sm mt-2">Choose a conversation from the list to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
