"use client";

import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon, ErrorIcon } from "@/components/ui/icons";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client";
import { Conversation, Message, User } from "@/api/types";

import {Sidebar} from "@/components/Sidebar"
import {ChatHeader} from "@/components/ChatHeader"
import {ChatArea} from "@/components/ChatArea"

import {streamResponse} from "@/libs/stream"
import {isMobileDevice} from "@/libs/utils"


function useConversations(token: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const convs = await api.getConversations(token);
      setConversations(convs);
    } catch (err) {
      console.error("Failed to load conversations", err);
      setError("Failed to load message history.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, isLoading, error, refreshConversations: fetchConversations };
}

function useChat(conversationId: number | null, token: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !token) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getConversationDetail({ id: conversationId, token });
        setMessages(data.messages);
      } catch (err) {
        setError("Failed to load message history.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId, token]);

  const sendMessage = useCallback(
    async (messageText: string, handleNewConversation: (newId: number) => void) => {
      if (!token) {
        setError("Authentication token not found.");
        return;
      }

      setIsStreaming(true);
      setError(null);

      const trimmedInput = messageText.trim();
      if (!trimmedInput) return;

      const optimisticUserMessage: Message = {
        id: Date.now(),
        role: "user",
        content: trimmedInput,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMessage]);

      try {
        const response = await api.postChat({ conversationId, message: trimmedInput, token });

        const newConversationIdHeader = response.headers.get("X-Conversation-Id");
        const newConversationId = newConversationIdHeader ? parseInt(newConversationIdHeader, 10) : null;

        if (!response.body) throw new Error("No response body");

        const assistantMessageId = Date.now() + 1;
        const placeholderAssistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, placeholderAssistantMessage]);

        await streamResponse(response.body, assistantMessageId, setMessages);

        if (newConversationId !== null && newConversationId !== conversationId) {
          handleNewConversation(newConversationId);
        }
      } catch (err) {
        console.error("Streaming failed:", err);
        setError("Sorry, the message failed to send.");
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId, token],
  );

  return { messages, isLoading, isStreaming, error, sendMessage };
}


export default function ChatPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { messages, isLoading: isMessagesLoading, isStreaming, error: chatError, sendMessage } = useChat(selectedConversationId, token);

  const { conversations, isLoading: isConversationsLoading, error: convError, refreshConversations } = useConversations(token);

  useEffect(() => {
    if (isMobileDevice()) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [user, isAuthLoading]);

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
          <Spinner />
          <p className="dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  const currentConversationTitle = selectedConversationId ? conversations.find((c) => c.id === selectedConversationId)?.title || "Chat" : "New Chat";

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
        <ChatHeader title={currentConversationTitle} onOpenSidebar={() => setIsSidebarOpen(true)} />
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
