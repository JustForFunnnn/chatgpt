export type MessageRole = "user" | "assistant";

export interface Message {
  id: number;
  role: MessageRole;
  content: string;
  created_at: string; // ISO 8601 date string
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface User {
  id: number;
  username: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}
