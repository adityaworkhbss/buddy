"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Send, ChevronDown, MoreVertical, Smile, Paperclip } from "lucide-react";
import { Input } from "@/component/ui/input";
import { Button } from "@/component/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { ScrollArea } from "@/component/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch current user and conversations
  useEffect(() => {
    fetchCurrentUserAndConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && currentUserId) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, currentUserId]);

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

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUserId || sending) return;

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("senderId", currentUserId.toString());
      formData.append("receiverId", selectedConversation.otherUserId.toString());
      formData.append("content", messageText);
      formData.append("type", "text");

      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Add new message to the list
        const newMessage: Message = {
          ...result.message,
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
        };
        setMessages(prev => [...prev, newMessage]);
        setMessageText("");

        // Refresh conversations to update last message
        await fetchCurrentUserAndConversations();
      } else {
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
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
            <h2 className="text-xl font-bold text-gray-900">Chats</h2>
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
                className="h-8 w-8"
                onClick={() => router.push(`/dashboard?view=profile&userId=${selectedConversation.otherUserId}`)}
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
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
                  messages.map((message) => {
                    const isUserMessage = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
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
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isUserMessage ? "text-pink-100" : "text-gray-500"
                            )}
                          >
                            {format(new Date(message.createdAt), "h:mm a")}
                            {isUserMessage && message.read && (
                              <span className="ml-1">✓✓</span>
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
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
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
                  disabled={sending || !messageText.trim()}
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
