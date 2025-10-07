"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/api/client";
import { Conversation } from "@/api/types";

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
