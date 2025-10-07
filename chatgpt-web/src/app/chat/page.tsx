"use client";

import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon, ErrorIcon } from "@/components/ui/icons";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client";
import { Conversation, Message, User } from "@/api/types";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

const CONSTANTS = {
  TYPING_SPEED: {
    CHAR_THRESHOLD: 100,
    SLOW_CHARS_PER_SEC: 30,
    FAST_CHARS_PER_SEC: 200,
  },
  BREAKPOINT: {
    MD: 768,
  },
} as const;

const formatTimestamp = (isoString: string) =>
  new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const isMobileDevice = () => typeof window !== "undefined" && window.innerWidth < CONSTANTS.BREAKPOINT.MD;

interface SSEEvent {
  type: "delta" | "done" | "error";
  data: string;
}

class SSEStreamParser {
  private remainder = "";

  parse(chunk: string): SSEEvent[] {
    this.remainder += chunk;
    const messageBlocks = this.remainder.split("\n\n");
    this.remainder = messageBlocks.pop() || "";

    return messageBlocks
      .filter((block) => block.trim())
      .map((block) => this.parseBlock(block))
      .filter((event): event is SSEEvent => event !== null);
  }

  private parseBlock(block: string): SSEEvent | null {
    let event = "";
    let data = "";

    const lines = block.split("\n");
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.substring(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.substring(6);
      }
    }

    if (!event) return null;

    return {
      type: event as SSEEvent["type"],
      data,
    };
  }
}

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

async function streamResponse(
  body: ReadableStream<Uint8Array>,
  assistantMessageId: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const streamParser = new SSEStreamParser();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const events = streamParser.parse(chunk);

    for (const event of events) {
      switch (event.type) {
        case "delta":
          try {
            const text = JSON.parse(event.data);
            if (typeof text === "string") {
              setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + text } : msg)));
            }
          } catch (e) {
            console.error("Error parsing SSE JSON data:", event.data, e);
          }
          break;

        case "done":
          return;

        case "error":
          console.error("Server-sent error event:", event.data);
          throw new Error("Streaming error");
      }
    }
  }
}

const UserPanel = memo(() => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  if (!user) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
      <div className="flex items-center p-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold flex-1 truncate">{user.username}</span>
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
        <button onClick={logout} title="Logout" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
});
UserPanel.displayName = "UserPanel";

const SkeletonLoader: FC = () => (
  <div className="space-y-3 pt-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="w-full h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse" />
    ))}
  </div>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: number | null) => void;
  conversations: Conversation[];
  selectedId: number | null;
  isLoading: boolean;
  loadError: string | null;
}
const Sidebar = memo<SidebarProps>(({ isOpen, onClose, onSelectConversation, conversations, selectedId, isLoading, loadError }) => (
  <>
    <div
      data-ag-ui-component="sidebar"
      className={`bg-gray-200 dark:bg-gray-800 p-4 flex flex-col w-80 h-full fixed z-30 md:relative md:translate-x-0 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center mb-4">
        <button
          onClick={() => onSelectConversation(null)}
          className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <NewIcon />
          New Chat
        </button>
        <button onClick={onClose} className="p-2 ml-2 md:hidden rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-semibold mb-2 px-2">History</h2>
        {isLoading ? (
          <SkeletonLoader />
        ) : loadError ? (
          <ErrorInfo message={loadError} />
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`p-3 rounded-lg cursor-pointer mb-1 truncate text-sm ${selectedId === conv.id ? "bg-blue-500 text-white" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}
            >
              {conv.title || `Chat from ${formatTimestamp(conv.created_at)}`}
            </div>
          ))
        )}
      </div>
      <UserPanel />
    </div>
  </>
));
Sidebar.displayName = "Sidebar";

export const MemoizedMarkdown = ({ content }: { content: string }) => {
  return (
    <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
MemoizedMarkdown.displayName = "MemoizedMarkdown";

interface MessageBubbleProps {
  msg: Message;
  isTyping: boolean;
}
export const MessageBubble = memo<MessageBubbleProps>(({ msg, isTyping }) => {
  const [isTypingStyleBubble, setIsTypingStyleBubble] = useState(isTyping);

  const [displayedContent, setDisplayedContent] = useState(isTypingStyleBubble ? "" : msg.content);

  useEffect(() => {
    if (isTyping && !isTypingStyleBubble) {
      setIsTypingStyleBubble(true);
    }
  }, [isTyping, isTypingStyleBubble]);

  useEffect(() => {
    if (isTypingStyleBubble) {
      if (displayedContent.length === msg.content.length) {
        return;
      }

      const typingSpeed = 20;
      const timeoutId = setTimeout(() => {
        setDisplayedContent(msg.content.substring(0, displayedContent.length + 1));
      }, typingSpeed);

      return () => clearTimeout(timeoutId);
    }
  }, [isTypingStyleBubble, displayedContent, msg.content]);

  const isCurrentlyTyping = isTypingStyleBubble && displayedContent.length !== msg.content.length;
  const contentToRender = isCurrentlyTyping ? displayedContent + "▍" : msg.content;

  return (
    <div className={`flex my-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-2xl min-w-0">
        <div
          className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"}`}
        >
          <div className="break-words text-sm">
            {msg.role === "assistant" ? <MemoizedMarkdown content={contentToRender} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
          </div>
        </div>
        <span className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
          {formatTimestamp(msg.created_at)}
        </span>
      </div>
    </div>
  );
});
MessageBubble.displayName = "MessageBubble";

const WelcomeScreen: FC = () => (
  <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
    <h2 className="text-2xl font-bold">Start Chatting</h2>
    <p>Select a conversation from your history or start a new one.</p>
  </div>
);

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  isLoading: boolean;
}
const ChatInput = memo<ChatInputProps>(({ onSendMessage, isStreaming, isLoading }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div data-ag-ui-component="chat-input" className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "AI is thinking . . ." : "Type a message..."}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-colors resize-none max-h-48 custom-scrollbar placeholder-gray-500 dark:placeholder-gray-400"
            rows={1}
            disabled={isStreaming || isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            disabled={isStreaming || isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
});
ChatInput.displayName = "ChatInput";

const ErrorInfo = ({ message }: { message: string }) => (
  <div className="p-3 h-full flex flex-row justify-center items-center text-red-500 dark:text-red-400">
    <ErrorIcon className="w-5 h-5 mr-2 flex-shrink-0" />
    <p className="text-sm font-semibold">{message}</p>
  </div>
);
interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  loadError: string | null;
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
}
const ChatArea = memo<ChatAreaProps>(({ messages, isLoading, loadError, isStreaming, onSendMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const onScroll = () => {
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      const { scrollTop, scrollHeight, clientHeight } = chatWindow;
      setShowScrollButton(scrollHeight - scrollTop > clientHeight + 150);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    const messagesContainer = messagesContainerRef.current;

    if (!chatWindow || !messagesContainer) return;

    const observer = new ResizeObserver(() => {
      const isScrolledToBottom = chatWindow.scrollHeight - chatWindow.scrollTop - chatWindow.clientHeight < 150;
      if (isScrolledToBottom) {
        scrollToBottom("auto");
      }
    });

    observer.observe(messagesContainer);

    return () => {
      observer.disconnect();
    };
  }, [scrollToBottom]);

  const renderChatContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex justify-center items-center">
          <Spinner />
        </div>
      );
    }
    if (loadError) {
      return <ErrorInfo message={loadError} />;
    }
    if (messages.length > 0) {
      return messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const isTyping = isStreaming && isLastMessage && msg.role === "assistant";
        return <MessageBubble key={msg.id} msg={msg} isTyping={isTyping} />;
      });
    }
    return <WelcomeScreen />;
  };

  return (
    <main className="flex-1 flex flex-col relative min-h-0">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" ref={chatWindowRef} onScroll={onScroll}>
        <div className={`max-w-4xl mx-auto ${messages.length === 0 ? "h-full" : ""}`} ref={messagesContainerRef}>
          {renderChatContent()}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity animate-fade-in"
        >
          <ChevronDownIcon />
        </button>
      )}
      <ChatInput onSendMessage={onSendMessage} isStreaming={isStreaming} isLoading={isLoading} />
    </main>
  );
});
ChatArea.displayName = "ChatArea";

interface ChatHeaderProps {
  title: string;
  /** Function to be called when the menu icon is clicked. */
  onOpenSidebar: () => void;
}

const ChatHeader = memo<ChatHeaderProps>(({ title, onOpenSidebar }) => {
  return (
    <header className="p-4 border-b border-gray-200 dark:border-gray-700 md:hidden flex items-center">
      <button onClick={onOpenSidebar} className="md:hidden">
        <MenuIcon />
      </button>
      <h1 className="text-lg font-semibold ml-4 truncate">{title}</h1>
    </header>
  );
});
ChatHeader.displayName = "ChatHeader";

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
