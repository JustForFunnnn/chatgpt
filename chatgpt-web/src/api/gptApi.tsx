import { ApiError } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Type Definitions for API Schemas ---
// These interfaces match the data structures from your backend Pydantic schemas.

/**
 * Represents a single message in a conversation.
 * Corresponds to `MessageSchema`.
 */
interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

/**
 * Represents a conversation summary.
 * Corresponds to `ConversationSchema`.
 */
interface Conversation {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
}

/**
 * Represents a detailed conversation including all its messages.
 * Corresponds to `ConversationDetailSchema`.
 */
interface ConversationDetail extends Conversation {
    messages: Message[];
}

/**
 * Represents user information.
 * Corresponds to `UserSchema`.
 */
interface User {
    id: number;
    username: string;
}

/**
 * Represents the authentication token response.
 * Corresponds to `TokenSchema`.
 */
interface Token {
    access_token: string;
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
    const data = await response.json().catch(() => ({})); // Gracefully handle non-json responses

    if (!response.ok) {
        const message = data.message || 'An unknown API error occurred.';
        const errorCode = data.error_code;
        const details = (typeof data.detail === 'object' && data.detail !== null) 
            ? data.detail 
            : { form: message };
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
const fetchWithAuth = (url: string, options: RequestInit, token: string) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };
    return fetch(url, { ...options, headers });
};


// --- Exported Auth API Functions ---
// Note: These functions are typically in their own file like `lib/authApi.ts`

/**
 * Logs in a user. Matches backend expecting form data.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Token>} - The login response containing the access token.
 */
export const loginUser = async (username: string, password: string): Promise<Token> => {
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
 * Registers a new user.
 * @param {string} username - The desired username.
 * @param {string} password - The desired password.
 * @returns {Promise<User>} - The newly created user's information.
 */
export const registerUser = async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
};


// --- Exported Chat API Functions ---

/**
 * Fetches all conversations for the authenticated user.
 * @param {string} token - The user's JWT token.
 */
export const getConversations = async (token: string): Promise<Conversation[]> => {
    console.log("API: GET /api/v1/conversations");
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations`, { method: 'GET' }, token);
    return handleResponse(response);
};

/**
 * Fetches messages for a specific conversation.
 * @param {object} params - The parameters object.
 * @param {number} params.id - The ID of the conversation.
 * @param {string} params.token - The user's JWT token.
 */
export const getConversationMessages = async ({ id, token }: { id: number; token: string }): Promise<Message[]> => {
    console.log(`API: GET /api/v1/conversations/${id}`);
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/conversations/${id}`, { method: 'GET' }, token);
    const data: ConversationDetail = await handleResponse(response);
    return data.messages;
};

/**
 * Posts a new chat message and returns a streamable response.
 * The request body matches the backend's `ChatRequestSchema`.
 * @param {object} params - The parameters object.
 * @param {number | null} params.conversationId - The ID of the conversation, or null for a new one.
 * @param {string} params.message - The user's input message.
 * @param {string} params.token - The user's JWT token.
 */
export const postChat = async ({ conversationId, message, token }: { conversationId: number | null; message: string; token: string }): Promise<Response> => {
    console.log("API: POST /api/v1/chat", { conversationId, message });
    
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            conversation_id: conversationId,
            user_input: message
        }),
    });

    if (!response.ok) {
        // For streaming responses, we handle errors before returning the raw stream.
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || "Failed to send message",
            errorData.detail || {},
            errorData.error_code
        );
    }
    
    return response; // Return the raw Response object for streaming
};

