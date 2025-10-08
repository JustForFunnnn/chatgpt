"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/api/client";
import { Message, ApiError } from "@/api/types";
import { streamResponse } from "@/libs/stream";

export function useChat(conversationId: number | null, token: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !token) {
      setMessages([]);
      return;
    }
    setIsStreaming(false);
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getConversationDetail({
          id: conversationId,
          token,
        });
        setMessages(data.messages);
      } catch (err) {
        let errMsg = "Failed to load message history, please try again later."
        if (err instanceof ApiError) {
          errMsg = err.message;
        }
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId, token]);

  const sendMessage = useCallback(
    async (
      messageText: string,
      handleNewConversation: (newId: number) => void,
    ) => {
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
        const response = await api.postChat({
          conversationId,
          message: trimmedInput,
          token,
        });

        const newConversationIdHeader =
          response.headers.get("X-Conversation-Id");
        const newConversationId = newConversationIdHeader
          ? parseInt(newConversationIdHeader, 10)
          : null;

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

        if (
          newConversationId !== null &&
          newConversationId !== conversationId
        ) {
          handleNewConversation(newConversationId);
        }
      } catch (err) {
        let errMsg = "Failed to send message, please try again later."
        if (err instanceof ApiError) {
          errMsg = err.message;
        }
        setError(errMsg);
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId, token],
  );

  return { messages, isLoading, isStreaming, error, sendMessage };
}
