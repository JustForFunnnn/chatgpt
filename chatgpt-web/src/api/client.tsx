import { ApiError } from "./errors";
import { User, Token, Conversation, ConversationDetail } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const handleResponse = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data.message || "An unknown API error occurred.";
    const errorCode = data.error_code;
    const details = data.detail || data;
    throw new ApiError(message, details, errorCode);
  }

  return data;
};

const fetchWithAuth = (url: string, options: RequestInit, token: string): Promise<Response> => {
  const headers: HeadersInit = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return fetch(url, { ...options, headers });
};

export const registerUser = async (username: string, password: string): Promise<User> => {
  console.log("API: POST /api/v1/register");
  const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
};

export const loginUser = async (username: string, password: string): Promise<Token> => {
  console.log("API: GET /api/v1/login");
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
};

export const logoutUser = async (token: string): Promise<any> => {
  console.log("API: POST /api/v1/logout");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/logout`, { method: "POST" }, token);
  return handleResponse(response);
};

export const getConversations = async (token: string): Promise<Conversation[]> => {
  console.log("API: GET /api/v1/conversations");
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations`, { method: "GET" }, token);
  return handleResponse(response);
};

export const getConversationDetail = async ({ id, token }: { id: number; token: string }): Promise<ConversationDetail> => {
  console.log(`API: GET /api/v1/conversations/${id}`);
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations/${id}`, { method: "GET" }, token);
  return handleResponse(response);
};

export const postChat = async ({
  conversationId,
  message,
  token,
}: {
  conversationId: number | null;
  message: string;
  token: string;
}): Promise<Response> => {
  console.log("API: POST /api/v1/chat", { conversationId, message });

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/v1/chat`,
    {
      method: "POST",
      body: JSON.stringify({
        conversation_id: conversationId,
        user_input: message,
      }),
    },
    token,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.message || "Failed to send message", errorData.detail || {}, errorData.error_code);
  }

  return response;
};
