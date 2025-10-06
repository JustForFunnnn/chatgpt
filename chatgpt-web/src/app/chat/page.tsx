"use client";

import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, SVGProps, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import {  MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon} from '@/components/ui/icons'


import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client"; 
import { Conversation, Message, User as ApiUser } from "@/api/types";

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

const formatTimestamp = (isoString: string) => new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

function useConversations(token: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const convs = await api.getConversations(token);
            setConversations(convs);
        } catch (err) {
            console.error("Failed to load conversations", err);
            // Optionally set an error state here
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return { conversations, isLoading, refreshConversations: fetchConversations };
}

/**
 * Custom hook to manage chat state. Now uses token for API calls.
 * The original logic for fetching messages and sending messages is preserved.
 */
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

    const sendMessage = useCallback(async (messageText: string, handleNewConversation: (newId: number) => void) => {
        if (!token) {
            setError("Authentication token not found.");
            return;
        }

        const trimmedInput = messageText.trim();
        if (!trimmedInput) return;

        const optimisticUserMessage: Message = {
            id: Date.now(),
            role: "user", 
            content: trimmedInput,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticUserMessage]);
        setIsStreaming(true);
        setError(null);

        const assistantMessageId = Date.now() + 1;
        let newConversationId = null;
        // show message first for better user experiences when API is fecthing result
        setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: `. . . . . ▍`, created_at: new Date().toISOString() }]);
        try {
            const response = await api.postChat({ conversationId, message: trimmedInput, token });
            
            const newConversationIdHeader = response.headers.get("X-Conversation-Id");
            if (newConversationIdHeader) {
                newConversationId = parseInt(newConversationIdHeader, 10);
            }
            
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: `` }
                        : msg
                )
            );

            let buffer = "";
            readerLoop: while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const messageBlocks = buffer.split("\n\n");
                // remove uncompleted seg
                buffer = messageBlocks.pop() || "";

                for (const block of messageBlocks) {
                    if (!block) continue;

                    let event = '';
                    let data = '';

                    const lines = block.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            event = line.substring(7).trim();
                        } else if (line.startsWith('data: ')) {
                            data = line.substring(6);
                        }
                    }
                    
                    switch (event) {
                        case 'delta':
                            try {
                                const text = JSON.parse(data);
                                if (typeof text === 'string') {
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantMessageId
                                                ? { ...msg, content: msg.content + text }
                                                : msg
                                        )
                                    );
                                }
                            } catch (e) {
                                console.error("Error parsing SSE JSON data:", data, e);
                            }
                            break;
                        
                        case 'done':
                            break readerLoop;

                        case 'error':
                            console.error('Server-sent error event:', data);
                            setError("An error occurred during streaming.");
                            break readerLoop;
                    }
                }
            }
        } catch (err) {
            console.error("Streaming failed:", err);
            setError("Sorry, the message failed to send.");
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: `Sorry, we encounter a issue, please try again later.` }
                        : msg
                )
            );
        } finally {
            setIsStreaming(false);
            if (newConversationId !== null && newConversationId != conversationId) {
                handleNewConversation(newConversationId)
            }
        }
    }, [conversationId, token]);

    return { messages, isLoading, isStreaming, error, sendMessage };
}


const CustomScrollbarStyles: FC = () => (
  <style>{`
    .dark .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-track {
      background: #2d3748;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #718096;
      border-radius: 4px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #a0aec0;
    }
    .dark .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #718096 #2d3748;
    }
    @keyframes blink {
        50% { opacity: 0; }
    }
    .animate-blink {
        animation: blink 1s step-end infinite;
    }
  `}</style>
);

const SkeletonLoader: FC = () => (
    <div className="space-y-3 pt-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse" />
        ))}
    </div>
);


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
                <button onClick={toggleTheme} title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
                    {theme === "light" ? <MoonIcon/> : <SunIcon/>}
                </button>
                <button onClick={logout} title="Logout" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
                    <LogoutIcon/>
                </button>
            </div>
        </div>
    );
});
UserPanel.displayName = "UserPanel";

const Sidebar = memo<{
    isOpen: boolean;
    onClose: () => void;
    onSelectConversation: (id: number | null) => void;
    conversations: Conversation[];
    selectedId: number | null;
    isLoading: boolean;
}>(({ isOpen, onClose, onSelectConversation, conversations, selectedId, isLoading}) => (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? "block" : "hidden"}`} onClick={onClose} />
      <aside data-ag-ui-component="sidebar" className={`bg-gray-200 dark:bg-gray-800 p-4 flex flex-col w-80 h-full fixed z-30 md:relative md:translate-x-0 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center mb-4">
            <button onClick={() => onSelectConversation(null)} className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <NewIcon />
                New Chat
            </button>
             <button onClick={onClose} className="p-2 ml-2 md:hidden rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">
                <CloseIcon />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-semibold mb-2 px-2">History</h2>
            {isLoading ? <SkeletonLoader /> : conversations.map(conv => (
                <div key={conv.id} onClick={() => onSelectConversation(conv.id)}
                     className={`p-3 rounded-lg cursor-pointer mb-1 truncate text-sm ${selectedId === conv.id ? "bg-blue-500 text-white" : "hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
                    {conv.title || `Chat from ${formatTimestamp(conv.created_at)}`}
                </div>
            ))}
        </div>
        <UserPanel />
    </aside>
    </>
));
Sidebar.displayName = "Sidebar";

export const MemoizedMarkdown = ({ content }: { content: string }) => {
    return (
        <div
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
        >
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

export const MessageBubble = memo<{ msg: Message; isTyping: boolean }>(({ msg, isTyping }) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const [isAnimating, setIsAnimating] = useState(isTyping);
    const CHAR_THRESHOLD = 100;
    const SLOW_SPEED = 30;
    const FAST_SPEED = 200;
    const currentSpeed = msg.content.length <= CHAR_THRESHOLD ? SLOW_SPEED : FAST_SPEED;
    const typingSpeed = 1000 / currentSpeed;

    useEffect(() => {
        if (isAnimating) {
            if (displayedContent.length === msg.content.length) {
                setIsAnimating(false);
                return;
            }
            const timeoutId = setTimeout(() => {
                setDisplayedContent(msg.content.substring(0, displayedContent.length + 1));
            }, typingSpeed);
            return () => clearTimeout(timeoutId);
        } else {
            setDisplayedContent(msg.content);
        }
    }, [msg.content, displayedContent, isAnimating, typingSpeed]);

    const contentToRender = isAnimating ? displayedContent + '▍' : msg.content;

    return (
        <div className={`flex my-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex flex-col max-w-2xl min-w-0">
                <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"}`}>
                    <div className="break-words text-sm">
                        {msg.role === 'assistant' ? (
                            <MemoizedMarkdown content={contentToRender} />
                        ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
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

const ChatInput = memo<{ onSendMessage: (message: string) => void; isStreaming: boolean; isLoading: boolean; }>(({ onSendMessage, isStreaming, isLoading }) => {
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
                        placeholder={isStreaming ? "AI is thinking..." : "Type a message..."}
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-colors resize-none max-h-48 custom-scrollbar placeholder-gray-500 dark:placeholder-gray-400"
                        rows={1}
                        disabled={isStreaming || isLoading}
                    />
                    <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                        disabled={isStreaming || isLoading || !input.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
});
ChatInput.displayName = "ChatInput";

const ChatArea = memo<{
    messages: Message[];
    isLoading: boolean;
    loadError: string | null;
    isStreaming: boolean;
    onSendMessage: (message: string) => void;
}>(({ messages, isLoading, loadError, isStreaming, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, []);

    const onScroll = () => {
        const chatWindow = chatWindowRef.current;
        if (chatWindow) {
            const { scrollTop, scrollHeight, clientHeight } = chatWindow;
            setShowScrollButton(scrollHeight - scrollTop > clientHeight + 200);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length > 0) {
                scrollToBottom("auto");
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isStreaming && !showScrollButton) {
            scrollToBottom("smooth");
        }
    }, [messages, isStreaming, showScrollButton, scrollToBottom]);

    const renderChatContent = () => {
        if (isLoading) {
            return <div className="h-full flex justify-center items-center"><Spinner/></div>;
        }
        if (loadError) {
            return <div className="h-full flex justify-center items-center text-red-500"><p>{loadError}</p></div>;
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
                <div className="max-w-4xl mx-auto h-full">
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


export default function ChatPage() {
    const { user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { 
        messages, 
        isLoading: isMessagesLoading, 
        isStreaming, 
        error: chatError, 
        sendMessage 
    } = useChat(selectedConversationId, token);

    const { 
        conversations, 
        isLoading: isConversationsLoading, 
        refreshConversations 
    } = useConversations(token);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.replace("/login");
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    const handleNewConversation = useCallback((newId: number) => {
        refreshConversations();
        setSelectedConversationId(newId);
    }, [refreshConversations]);

    const handleSelectConversation = useCallback((id: number | null) => {
        if (selectedConversationId === id) return;
        setSelectedConversationId(id);
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [selectedConversationId]);

    const handleSendMessage = useCallback((message: string) => {
        sendMessage(message, handleNewConversation);
    }, [sendMessage, handleNewConversation]);

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
    
    if (!user) {
        return null; 
    }
    
    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden`}>
            <CustomScrollbarStyles />
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onSelectConversation={handleSelectConversation}
                conversations={conversations}
                selectedId={selectedConversationId}
                isLoading={isConversationsLoading}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 md:hidden flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
                        <MenuIcon />
                    </button>
                    <h1 className="text-lg font-semibold ml-4 truncate">
                        {selectedConversationId
                            ? conversations.find(c => c.id === selectedConversationId)?.title || "Chat"
                            : "New Chat"}
                    </h1>
                </header>
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