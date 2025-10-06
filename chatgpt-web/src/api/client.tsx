import { ApiError } from './errors';

// It's good practice to have this in a .env file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// --- Type Definitions for API Schemas ---
// These interfaces match the data structures from your backend Pydantic schemas.

/**
 * Defines the possible roles for a message author.
 * Corresponds to `MessageRole` enum in the backend.
 */
export type MessageRole = 'user' | 'assistant';

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
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
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
export interface Token {
    access_token: string;
    token_type: string;
}


// --- Reusable API Helpers ---

/**
 * A helper to handle standard JSON API responses.
 * It parses the JSON and throws a structured ApiError on failure.
 * @param {Response} response - The raw fetch response object.
 * @returns {Promise<any>} - The JSON response data if the request was successful.
 * @throws {ApiError} - Throws a custom error with details if the request fails.
 */
const handleResponse = async (response: Response) => {
    // Gracefully handle non-json or empty responses for success cases (e.g., 204 No Content)
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message = data.message || 'An unknown API error occurred.';
        const errorCode = data.error_code;
        // Use the full data object as detail if a specific 'detail' field is not present
        const details = data.detail || data; 
        throw new ApiError(message, details, errorCode);
    }
    
    return data;
};

/**
 * A wrapper for fetch that includes the Authorization header for authenticated requests.
 * @param {string} url - The URL to fetch.
 * @param {RequestInit} options - The options for the fetch call.
 * @param {string} token - The JWT token for authorization.
 * @returns {Promise<Response>} - The raw fetch response.
 */
const fetchWithAuth = (url: string, options: RequestInit, token: string): Promise<Response> => {
    const headers: HeadersInit = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    return fetch(url, { ...options, headers });
};


// --- API Functions ---

// SECTION: Authentication

/**
 * Registers a new user.
 * @param {string} username - The desired username.
 * @param {string} password - The desired password.
 * @returns {Promise<User>} - The newly created user's information.
 */
export const registerUser = async (username: string, password: string): Promise<User> => {
    console.log("API: POST /api/v1/register");
    const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};

/**
 * Logs in a user. Matches backend expecting form data.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Token>} - The login response containing the access token.
 */
export const loginUser = async (username: string, password: string): Promise<Token> => {
    console.log("API: GET /api/v1/login");
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
        method: 'POST',
        body: formData,
    });
    
    return handleResponse(response);
};

/**
 * Logs out the current user.
 * The backend is stateless, so this is mainly for the client to know
 * it should clear its local token.
 * @param {string} token - The user's JWT token.
 * @returns {Promise<any>} - The successful logout response.
 */
export const logoutUser = async (token: string): Promise<any> => {
    console.log("API: POST /api/v1/logout");
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/logout`, { method: 'POST' }, token);
    return handleResponse(response);
};


// SECTION: Conversations

/**
 * Fetches all conversations for the authenticated user.
 * @param {string} token - The user's JWT token.
 * @returns {Promise<Conversation[]>} - A list of the user's conversations.
 */
export const getConversations = async (token: string): Promise<Conversation[]> => {
    console.log("API: GET /api/v1/conversations");
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations`, { method: 'GET' }, token);
    return handleResponse(response);
};

/**
 * Fetches a specific conversation including its messages.
 * [MODIFIED] This now returns the complete ConversationDetail object to match the backend.
 * @param {object} params - The parameters object.
 * @param {number} params.id - The ID of the conversation.
 * @param {string} params.token - The user's JWT token.
 * @returns {Promise<ConversationDetail>} - The full conversation details.
 */
export const getConversationDetail = async ({ id, token }: { id: number; token: string }): Promise<ConversationDetail> => {
    console.log(`API: GET /api/v1/conversations/${id}`);
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations/${id}`, { method: 'GET' }, token);
    return handleResponse(response);
};


// SECTION: Chat

/**
 * Posts a new chat message and returns a streamable response for Server-Sent Events (SSE).
 * The request body matches the backend's `ChatRequestSchema`.
 * The calling component is responsible for reading the stream from the returned Response object.
 * @param {object} params - The parameters object.
 * @param {number | null} params.conversationId - The ID of the conversation, or null for a new one.
 * @param {string} params.message - The user's input message.
 * @param {string} params.token - The user's JWT token.
 * @returns {Promise<Response>} - The raw Response object to be processed as a stream.
 */
export const postChat = async ({ conversationId, message, token }: { conversationId: number | null; message: string; token: string }): Promise<Response> => {
    console.log("API: POST /api/v1/chat", { conversationId, message });
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/chat`, {
        method: "POST",
        body: JSON.stringify({
            conversation_id: conversationId,
            user_input: message
        }),
    }, token);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || "Failed to send message",
            errorData.detail || {},
            errorData.error_code
        );
    }
    
    return response
};
