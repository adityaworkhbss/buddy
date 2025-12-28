"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Send, ChevronDown } from "lucide-react";
import { Input } from "@/component/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { ScrollArea } from "@/component/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/component/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  profileId?: string;
}

const mockConversations: Conversation[] = [
  { 
    id: "1", 
    name: "Priya Sharma", 
    avatar: "https://randomuser.me/api/portraits/women/44.jpg", 
    lastMessage: "Hey! Is the room still available?", 
    timestamp: "10:30 AM", 
    unread: 2, 
    online: false, 
    profileId: "1" 
  },
  { 
    id: "2", 
    name: "Rahul Verma", 
    avatar: "https://randomuser.me/api/portraits/men/32.jpg", 
    lastMessage: "Sure, let's meet tomorrow", 
    timestamp: "9:15 AM", 
    unread: 0, 
    online: false, 
    profileId: "2" 
  },
  { 
    id: "3", 
    name: "Ananya Patel", 
    avatar: "https://randomuser.me/api/portraits/women/28.jpg", 
    lastMessage: "The flat looks great!", 
    timestamp: "Yesterday", 
    unread: 0, 
    online: true, 
    profileId: "3" 
  },
  { 
    id: "4", 
    name: "Vikram Singh", 
    avatar: "https://randomuser.me/api/portraits/men/45.jpg", 
    lastMessage: "What's the rent?", 
    timestamp: "Yesterday", 
    unread: 1, 
    online: false, 
    profileId: "4" 
  },
  { 
    id: "5", 
    name: "Neha Gupta", 
    avatar: "https://randomuser.me/api/portraits/women/35.jpg", 
    lastMessage: "Thanks for the info", 
    timestamp: "Monday", 
    unread: 0, 
    online: false, 
    profileId: "5" 
  },
  { 
    id: "6", 
    name: "Arjun Reddy", 
    avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
    lastMessage: "I'm interested in the 2BHK", 
    timestamp: "Monday", 
    unread: 0, 
    online: true, 
    profileId: "6" 
  },
];

export const MessagePage = () => {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "you-first" | "they-first">("all");

  const filteredConversations = mockConversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedConversation?.id === conversation.id && "bg-gray-50"
                )}
                onClick={() => setSelectedConversation(conversation)}
              >
                {/* Avatar with Online Indicator */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {conversation.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 truncate text-sm">
                      {conversation.name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area - Right Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Chat view will be implemented here</p>
            </div>
          </div>
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
