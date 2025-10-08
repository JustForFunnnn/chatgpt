"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/api/client";
import { Conversation, ApiError } from "@/api/types";

export function useConversations(token: string | null) {
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
      let errMsg = "Failed to load message history, please try again later."
      if (err instanceof ApiError) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refreshConversations: fetchConversations,
  };
}
