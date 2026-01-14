"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Send, ChevronDown, Smile, Paperclip, User } from "lucide-react";
import { Input } from "@/component/ui/input";
import { Button } from "@/component/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { ScrollArea } from "@/component/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { useSocket } from "@/hooks/useSocket";
import type { Socket } from "socket.io-client";

interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserProfilePicture: string | null;
  lastMessage: {
    content: string | null;
    type: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

interface Message {
  id: number;
  conversationId?: number;
  content: string | null;
  type: string;
  senderId: number;
  receiverId: number;
  sender: {
    id: number;
    fullName: string | null;
    profilePicture: string | null;
  };
  receiver: {
    id: number;
    fullName: string | null;
    profilePicture: string | null;
  };
  read: boolean;
  createdAt: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
}

export const MessagePage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "you-first" | "they-first">("all");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  const { socket, isConnected } = useSocket(currentUserId);

  // Fetch current user and conversations
  useEffect(() => {
    fetchCurrentUserAndConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUserId) {
      setCurrentConversationId(selectedConversation.id);
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      
      // Join conversation room via socket
      if (socket && isConnected) {
        socket.emit("join_conversation", selectedConversation.id);
      }
    } else {
      setMessages([]);
      setCurrentConversationId(null);
      
      // Leave conversation room
      if (socket && currentConversationId) {
        socket.emit("leave_conversation", currentConversationId);
      }
    }
  }, [selectedConversation, currentUserId, socket, isConnected]);

  // Listen for read status updates
  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = (data: { conversationId: number; userId: number }) => {
      if (currentConversationId && data.conversationId === currentConversationId) {
        // Update read status for messages sent by current user to the other user
        setMessages(prev =>
          prev.map(msg => {
            if (msg.senderId === currentUserId && msg.receiverId === data.userId) {
              return { ...msg, read: true };
            }
            return msg;
          })
        );
      }
    };

    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, currentConversationId, currentUserId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for real-time messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("Received new message via socket:", message);
      
      // Only add message if it's for the current conversation
      if (currentConversationId && message.conversationId === currentConversationId) {
        setMessages(prev => {
          // Check if message already exists by ID (avoid duplicates)
          const existsById = prev.some(m => m.id === message.id);
          if (existsById) {
            console.log("Duplicate message detected by ID, skipping:", message.id);
            return prev;
          }
          
          // Check if this is replacing an optimistic message (same sender, same content, recent timestamp)
          const isReplacingOptimistic = prev.some(m => 
            m.senderId === message.senderId &&
            m.content === message.content &&
            m.receiverId === message.receiverId &&
            typeof m.id === 'number' && m.id > 1000000000000 // Optimistic messages have timestamp IDs
          );
          
          if (isReplacingOptimistic) {
            // Replace optimistic message with real one
            return prev.map(m => {
              if (m.senderId === message.senderId &&
                  m.content === message.content &&
                  m.receiverId === message.receiverId &&
                  typeof m.id === 'number' && m.id > 1000000000000) {
                return message;
              }
              return m;
            }).filter((m, index, arr) => 
              // Remove any other duplicates
              arr.findIndex(msg => msg.id === m.id) === index
            );
          }
          
          return [...prev, message];
        });
        
        // Mark as read if it's the current conversation
        if (message.receiverId === currentUserId) {
          markMessagesAsRead(currentConversationId);
        }
        
        // Scroll to bottom to show new message
        setTimeout(() => scrollToBottom(), 100);
      }

      // Update conversations list with new last message
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: message.content,
                type: message.type,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
              unreadCount: 
                message.receiverId === currentUserId && 
                (!selectedConversation || selectedConversation.id !== message.conversationId)
                  ? conv.unreadCount + 1
                  : conv.unreadCount,
            };
          }
          return conv;
        })
      );
      
      // Update selected conversation if it's the current one
      if (selectedConversation && selectedConversation.id === message.conversationId) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          lastMessage: {
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
          },
          lastMessageAt: message.createdAt,
        } : null);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, currentConversationId, currentUserId, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCurrentUserAndConversations = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const meResponse = await fetch("/api/user/me");
      const meData = await meResponse.json();
      
      if (!meData.success || !meData.user) {
        throw new Error("Failed to get user information");
      }

      setCurrentUserId(meData.user.id);

      // Fetch conversations
      const conversationsResponse = await fetch(`/api/messages/conversations?userId=${meData.user.id}`);
      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success) {
        setConversations(conversationsData.conversations);
      } else {
        throw new Error(conversationsData.message || "Failed to fetch conversations");
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      } else {
        throw new Error(data.message || "Failed to fetch messages");
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (conversationId: number) => {
    if (!currentUserId) return;

    try {
      await fetch("/api/messages", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          userId: currentUserId,
        }),
      });

      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleViewProfile = async () => {
    if (!selectedConversation || isLoadingProfile) return;

    try {
      setIsLoadingProfile(true);

      // Get share URL for the other user's profile
      const shareResponse = await fetch(`/api/user/share?userId=${selectedConversation.otherUserId}`);
      const shareData = await shareResponse.json();

      if (shareData.success && shareData.shareUrl) {
        // Extract the path from the full URL (API returns full URL, router.push needs relative path)
        const url = new URL(shareData.shareUrl);
        router.push(url.pathname);
      } else {
        throw new Error(shareData.message || "Failed to get share link");
      }
    } catch (error: any) {
      console.error("Error opening profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation || !currentUserId) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file only.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "messages");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || "Failed to upload image");
      }

      // Send message with image
      const messageFormData = new FormData();
      messageFormData.append("senderId", currentUserId.toString());
      messageFormData.append("receiverId", selectedConversation.otherUserId.toString());
      messageFormData.append("content", "");
      messageFormData.append("type", "image");
      messageFormData.append("fileUrl", uploadData.url);
      messageFormData.append("fileName", file.name);
      messageFormData.append("fileSize", file.size.toString());
      messageFormData.append("fileType", file.type);
      if (selectedConversation.id) {
        messageFormData.append("conversationId", selectedConversation.id.toString());
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        body: messageFormData,
      });

      const result = await response.json();

      if (result.success) {
        // The socket event will handle adding the real message
        if (!isConnected || !socket) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === result.message.id);
            if (exists) return prev;
            return [...prev, result.message];
          });
        }
      } else {
        throw new Error(result.message || "Failed to send image");
      }
    } catch (error: any) {
      console.error("Error sending image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
    "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
    "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
    "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
    "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👏",
    "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "💯", "🔥", "⭐", "🌟", "✨", "💫", "🎉", "🎊",
  ];

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUserId || sending) return;

    const messageContent = messageText.trim();
    const tempMessageId = Date.now(); // Temporary ID for optimistic update
    const now = new Date().toISOString();

    // Optimistically add message immediately for smooth UX
    const optimisticMessage: Message = {
      id: tempMessageId,
      conversationId: selectedConversation.id,
      content: messageContent,
      type: "text",
      senderId: currentUserId,
      receiverId: selectedConversation.otherUserId,
      sender: {
        id: currentUserId,
        fullName: null,
        profilePicture: null,
      },
      receiver: {
        id: selectedConversation.otherUserId,
        fullName: selectedConversation.otherUserName,
        profilePicture: selectedConversation.otherUserProfilePicture,
      },
      read: false,
      createdAt: now,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText(""); // Clear input immediately

    // Optimistically update conversation list
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            lastMessage: {
              content: messageContent,
              type: "text",
              createdAt: now,
            },
            lastMessageAt: now,
          };
        }
        return conv;
      })
    );

    // Update selected conversation state
    setSelectedConversation(prev => prev ? {
      ...prev,
      lastMessage: {
        content: messageContent,
        type: "text",
        createdAt: now,
      },
      lastMessageAt: now,
    } : null);

    // Scroll to bottom to show new message
    setTimeout(() => scrollToBottom(), 100);

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("senderId", currentUserId.toString());
      formData.append("receiverId", selectedConversation.otherUserId.toString());
      formData.append("content", messageContent);
      formData.append("type", "text");
      if (selectedConversation.id) {
        formData.append("conversationId", selectedConversation.id.toString());
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // The socket event will handle adding the real message
        // If socket is not connected, we need to replace optimistic message with real one
        if (!isConnected || !socket) {
          setMessages(prev => {
            // Remove optimistic message and add real one
            const filtered = prev.filter(m => m.id !== tempMessageId);
            const exists = filtered.some(m => m.id === result.message.id);
            if (exists) return filtered;
            return [...filtered, result.message];
          });
        } else {
          // Socket is connected, so the socket event will add the real message
          // Remove the optimistic message when real one arrives (handled by socket listener)
          // The socket listener checks for duplicates, so it will replace it
        }
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      
      // Revert conversation update
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === selectedConversation.id) {
            // Restore previous last message (we don't have it, so just keep current state)
            // In practice, this won't matter much as the error is rare
            return conv;
          }
          return conv;
        })
      );
      
      // Restore message text
      setMessageText(messageContent);
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return format(date, "h:mm a");
      } else if (diffInHours < 48) {
        return "Yesterday";
      } else if (diffInHours < 168) {
        return format(date, "EEE");
      } else {
        return format(date, "MMM d");
      }
    } catch {
      return "";
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (messageFilter === "all") return matchesSearch;
    // For now, return all matching search. Can implement you-first/they-first later
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-white">
      {/* Conversations Sidebar - Left Panel */}
      <div className="w-[380px] border-r border-gray-200 flex flex-col bg-white">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Chats</h2>
              {process.env.NEXT_PUBLIC_SOCKET_URL && (
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} title={isConnected ? "Real-time connected" : "Real-time unavailable (messages will still work)"} />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">
                    {messageFilter === "all" ? "All" : messageFilter === "you-first" ? "You messaged first" : "They messaged first"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white rounded-md shadow-lg border border-gray-200 p-1">
                <DropdownMenuItem
                  onClick={() => setMessageFilter("all")}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm text-gray-900 focus:bg-gray-100",
                    messageFilter === "all" && "bg-gray-100"
                  )}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setMessageFilter("you-first")}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm text-gray-900 focus:bg-gray-100",
                    messageFilter === "you-first" && "bg-gray-100"
                  )}
                >
                  You messaged first
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setMessageFilter("they-first")}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm text-gray-900 focus:bg-gray-100",
                    messageFilter === "they-first" && "bg-gray-100"
                  )}
                >
                  They messaged first
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search or start new chat"
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-2">Start a conversation from a profile card</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedConversation?.id === conversation.id && "bg-gray-50"
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={conversation.otherUserProfilePicture || "https://randomuser.me/api/portraits/women/44.jpg"} 
                        alt={conversation.otherUserName} 
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {conversation.otherUserName.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 truncate text-sm">
                        {conversation.otherUserName}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.lastMessageAt ? formatTimestamp(conversation.lastMessageAt) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || "No messages yet"}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area - Right Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={selectedConversation.otherUserProfilePicture || "https://randomuser.me/api/portraits/women/44.jpg"} 
                    alt={selectedConversation.otherUserName} 
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {selectedConversation.otherUserName.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedConversation.otherUserName}</h3>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:text-gray-900"
                onClick={handleViewProfile}
                disabled={isLoadingProfile}
                title="View Profile"
              >
                <User className={`w-5 h-5 ${isLoadingProfile ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-4" ref={messagesContainerRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isUserMessage = message.senderId === currentUserId;
                    // Use a combination of id and index to ensure unique keys
                    const uniqueKey = message.id ? `msg-${message.id}` : `msg-temp-${index}-${message.createdAt}`;
                    return (
                      <div
                        key={uniqueKey}
                        className={cn(
                          "flex",
                          isUserMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isUserMessage
                              ? "bg-pink-500 text-white"
                              : "bg-white text-gray-900 shadow-sm"
                          )}
                        >
                          {message.type === "image" && message.fileUrl ? (
                            <div className="mb-2">
                              <img
                                src={message.fileUrl}
                                alt={message.fileName || "Image"}
                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                onClick={() => window.open(message.fileUrl || "", "_blank")}
                              />
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <p
                            className={cn(
                              "text-xs mt-1 flex items-center gap-1",
                              isUserMessage ? "text-pink-100" : "text-gray-500"
                            )}
                          >
                            <span>{format(new Date(message.createdAt), "h:mm a")}</span>
                            {isUserMessage && (
                              <span className={cn(
                                "ml-1 text-sm inline-flex items-center",
                                message.read ? "text-blue-200" : "text-pink-100"
                              )}>
                                {message.read ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1.5 13.5L4.5 16.5L12 8.5" stroke="#FC8EAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 12.5L12 16.5L22 4.5" stroke="#FFD1DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M8 12.5L12 16.5L22 4.5" stroke="#FFD1DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input Area */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 h-48 overflow-y-auto z-50"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  type="button"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  type="button"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-gray-50 border-gray-200 focus:bg-white"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-pink-500 hover:bg-pink-600 text-white h-8 w-8 p-0"
                  size="icon"
                  disabled={sending || uploadingFile || !messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                <Send className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Your Messages</h3>
              <p className="text-gray-600 max-w-sm">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
