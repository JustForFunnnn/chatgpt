/**
 * Represents the role of a message sender.
 * Corresponds to `MessageRole` enum in the backend.
 */
export type MessageRole = "user" | "assistant";

/**
 * Represents a single message in a conversation.
 * Corresponds to `MessageSchema`.
 */
export interface Message {
  id: number;
  role: MessageRole;
  content: string;
  created_at: string; // ISO 8601 date string
}

/**
 * Represents a conversation summary.
 * Corresponds to `ConversationSchema`.
 */
export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a detailed conversation including all its messages.
 * Corresponds to `ConversationDetailSchema`.
 */
export interface ConversationDetail extends Conversation {
  messages: Message[];
}

/**
 * Represents user information.
 * Corresponds to `UserSchema`.
 */
export interface User {
  id: number;
  username: string;
}

/**
 * Represents the authentication token response.
 * Corresponds to `TokenSchema`.
 */
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}
