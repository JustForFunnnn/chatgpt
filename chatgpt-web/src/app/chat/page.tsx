"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { LoadingIcon } from "@/components/ui/icons";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatArea } from "@/components/ChatArea";
import { isMobileDevice } from "@/libs/utils";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";

export default function ChatPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    messages,
    isLoading: isMessagesLoading,
    isStreaming,
    error: chatError,
    sendMessage,
  } = useChat(selectedConversationId, token);

  const {
    conversations,
    isLoading: isConversationsLoading,
    error: convError,
    refreshConversations,
  } = useConversations(token);

  useEffect(() => {
    if (isMobileDevice()) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [user, isAuthLoading, router]);

  const handleNewConversation = useCallback(
    (newId: number) => {
      refreshConversations();
      setSelectedConversationId(newId);
    },
    [refreshConversations],
  );

  const handleSelectConversation = useCallback(
    (id: number | null) => {
      if (selectedConversationId === id) return;
      setSelectedConversationId(id);
      if (isMobileDevice()) {
        setIsSidebarOpen(false);
      }
    },
    [selectedConversationId],
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message, handleNewConversation);
    },
    [sendMessage, handleNewConversation],
  );

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <LoadingIcon />
          <p className="dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const currentConversationTitle = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId)?.title ||
      "Chat"
    : "New Chat";

  return (
    <div
      className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
        conversations={conversations}
        selectedId={selectedConversationId}
        isLoading={isConversationsLoading}
        loadError={convError}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          title={currentConversationTitle}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <ChatArea
          messages={messages}
          isLoading={isMessagesLoading}
          loadError={chatError}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
