"use client";

import React, { useState, useEffect, useMemo, useRef, FormEvent, useCallback, memo, FC, SVGProps, ChangeEvent, useLayoutEffect } from "react";

// --- Icon Components (unchanged) ---
const MenuIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const SunIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6.993 12c0 2.761 2.246 5.007 5.007 5.007s5.007-2.246 5.007-5.007-2.246-5.007-5.007-5.007S6.993 9.239 6.993 12zM12 8.993c1.658 0 3.007 1.349 3.007 3.007S13.658 15.007 12 15.007 8.993 13.658 8.993 12 10.342 8.993 12 8.993zM10.993 19h2v3h-2zm0-17h2v3h-2zm-9 9h3v2h-3zm17 0h3v2h-3zM4.219 18.363l2.122-2.122 1.414 1.414-2.122 2.122zM16.24 6.344l2.122-2.122 1.414 1.414-2.122 2.122zM6.344 7.758 4.222 5.636l1.414-1.414 2.122 2.122zm13.434 10.605-1.414 1.414-2.122-2.122 1.414-1.414z"></path></svg>
);
const MoonIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 11.807A9.002 9.002 0 0 1 10.049 2a9.942 9.942 0 0 0-5.12 2.735c-3.905 3.905-3.905 10.237 0 14.142 3.906 3.906 10.237 3.905 14.143 0a9.946 9.946 0 0 0 2.735-5.119A9.003 9.003 0 0 1 12 11.807z"></path></svg>
);
const ChevronDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const Spinner: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);
const LogoutIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);
const CloseIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const NewIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg  {...props} width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon" aria-hidden="true"><path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z"></path></svg>
);


// --- Type Definitions (Aligned with Backend) ---
interface Message {
    id: number;
    conversation_id: number;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}
interface Conversation {
    id: number;
    title: string;
    created_at: string;
}
interface ConversationDetail extends Conversation {
    messages: Message[];
}
interface User { name: string; }
type Theme = "light" | "dark";

// --- API Module for Real Backend Communication ---
const API_BASE_URL = "http://127.0.0.1:8000";

const api = {
    getConversations: async (): Promise<Conversation[]> => {
        console.log("API: GET /api/v1/conversations");
        const response = await fetch(`${API_BASE_URL}/api/v1/conversations`);
        if (!response.ok) {
            throw new Error("Failed to fetch conversations");
        }
        return response.json();
    },
    getConversationMessages: async (id: number): Promise<Message[]> => {
        console.log(`API: GET /api/v1/conversations/${id}`);
        const response = await fetch(`${API_BASE_URL}/api/v1/conversations/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch messages");
        }
        const data: ConversationDetail = await response.json();
        return data.messages;
    },
    postLogout: async () => {
        // This remains mocked for now as there is no backend endpoint
        console.log("API: POST /api/v1/logout");
        await new Promise(res => setTimeout(res, 200));
        return { success: true };
    },
    postChat: async (payload: { conversationId: number | null; message: string; }): Promise<Response> => {
        console.log("API: POST /api/v1/chat", payload);
        const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_id: payload.conversationId,
                user_input: payload.message
            }),
        });
        if (!response.ok) {
            throw new Error("Failed to send message");
        }
        return response; // Return the raw Response object for streaming
    }
};

// --- Helper Functions & Custom Hooks ---
const formatTimestamp = (isoString: string) => new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

function useTheme(initialTheme: Theme = "light") {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const storedTheme = typeof window !== "undefined" ? localStorage.getItem("chat-app-theme") as Theme : null;
            return storedTheme || initialTheme;
        } catch (error) {
            console.error("Error reading theme from localStorage", error);
            return initialTheme;
        }
    });

    useEffect(() => {
        try {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(theme);
            localStorage.setItem("chat-app-theme", theme);
        } catch (error) {
            console.error("Error handling theme in localStorage", error);
        }
    }, [theme]);

    return [theme, setTheme] as const;
}

function useChat(conversationId: number | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        const fetchMessages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.getConversationMessages(conversationId);
                setMessages(data);
            } catch (err) {
                setError("Failed to load message history.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [conversationId]);

    const sendMessage = useCallback(async (messageText: string, onNewConversationStarted: (newId: number) => void) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput) return;

        // Optimistically add user message
        const optimisticUserMessage: Message = {
            id: Date.now(), // Temporary ID
            conversation_id: conversationId || -1, // Temporary ID
            role: "user", content: trimmedInput,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticUserMessage]);
        setIsStreaming(true);
        setError(null);

        try {
            const response = await api.postChat({ conversationId, message: trimmedInput });
            
            // Handle new conversation creation from header
            const newConversationIdHeader = response.headers.get("X-Conversation-Id");
            const currentConvId = newConversationIdHeader ? parseInt(newConversationIdHeader, 10) : conversationId;

            if (newConversationIdHeader) {
                onNewConversationStarted(parseInt(newConversationIdHeader, 10));
            }
            
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const assistantMessageId = Date.now() + 1; // Temporary ID
            setMessages(prev => [...prev, { id: assistantMessageId, conversation_id: currentConvId!, role: "assistant", content: "", created_at: new Date().toISOString() }]);

            let buffer = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                
                // Keep the last partial line in the buffer
                buffer = lines.pop() || ""; 
                
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const chunk = line.substring(6);
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: msg.content + chunk }
                                    : msg
                            )
                        );
                    }
                }
            }
        } catch (err) {
            console.error("Streaming failed:", err);
            setError("Sorry, the message failed to send.");
            // Rollback optimistic update
            setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id));
        } finally {
            setIsStreaming(false);
        }
    }, [conversationId]);

    return { messages, isLoading, isStreaming, error, sendMessage };
}

// --- Child Components (unchanged, using memo for performance) ---

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

const UserPanel = memo<{ user: User; onLogout: () => void; theme: Theme; onSetTheme: (theme: Theme) => void; }>(
    ({ user, onLogout, theme, onSetTheme }) => (
    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
        <div className="flex items-center p-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                {user.name.charAt(0)}
            </div>
            <span className="font-semibold flex-1 truncate">{user.name}</span>
            <button onClick={() => onSetTheme(theme === "light" ? "dark" : "light")} title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
                {theme === "light" ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
            </button>
            <button onClick={onLogout} title="Logout" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
                <LogoutIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
));
UserPanel.displayName = "UserPanel";

const Sidebar = memo<{
    isOpen: boolean;
    onClose: () => void;
    onSelectConversation: (id: number | null) => void;
    conversations: Conversation[];
    selectedId: number | null;
    isLoading: boolean;
    currentUser: User;
    onLogout: () => void;
    theme: Theme;
    onSetTheme: (theme: Theme) => void;
}>(({ isOpen, onClose, onSelectConversation, conversations, selectedId, isLoading, currentUser, onLogout, theme, onSetTheme }) => (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? "block" : "hidden"}`} onClick={onClose} />
      <aside data-ag-ui-component="sidebar" className={`bg-gray-200 dark:bg-gray-800 p-4 flex flex-col w-80 h-full fixed z-30 md:relative md:translate-x-0 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center mb-4">
            <button onClick={() => onSelectConversation(null)} className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <NewIcon className="w-6 h-6" />
                New Chat
            </button>
             <button onClick={onClose} className="p-2 ml-2 md:hidden rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">
                <CloseIcon className="w-6 h-6" />
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
        <UserPanel user={currentUser} onLogout={onLogout} theme={theme} onSetTheme={onSetTheme} />
    </aside>
    </>
));
Sidebar.displayName = "Sidebar";


import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
    return (
        <div
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
        >
        <ReactMarkdown
            key={content} // 添加 key 强制重新渲染
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
});
MemoizedMarkdown.displayName = "MemoizedMarkdown";

export const MessageBubble = memo<{ msg: Message; isTyping: boolean }>(({ msg, isTyping }) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const [isAnimating, setIsAnimating] = useState(isTyping);

    const CHAR_THRESHOLD = 100;   // 字符临界点
    const SLOW_SPEED = 30;       // 慢速模式
    const FAST_SPEED = 200;      // 快速模式
    // 2. 根据文本长度选择速度
    const currentSpeed = msg.content.length <= CHAR_THRESHOLD ? SLOW_SPEED : FAST_SPEED;
    // 3. 将“速度值”转换为“延迟毫秒数”
    const typingSpeed = 1000 / currentSpeed;

    useEffect(() => {
        // 当 isAnimating 为 true 时，我们才处理打字机效果
        if (isAnimating) {
            // 如果动画已显示完毕
            if (displayedContent.length === msg.content.length) {
                setIsAnimating(false);
                return;
            }

            // 核心动画逻辑
            const timeoutId = setTimeout(() => {
                setDisplayedContent(msg.content.substring(0, displayedContent.length + 1));
            }, typingSpeed);

            return () => clearTimeout(timeoutId);
        } else {
            // 如果不在动画状态，直接显示完整内容（不带光标）
            setDisplayedContent(msg.content);
        }
    }, [msg.content, displayedContent, isAnimating, typingSpeed]);

    // --- ↓↓↓ 核心改动：最终要渲染的内容 ---
    // 如果在动画中，就在当前显示的文本后附加光标字符
    const contentToRender = isAnimating ? displayedContent + '▍' : displayedContent;

    return (
        <div className={`flex my-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex flex-col max-w-2xl min-w-0">
                <div className={`p-4 rounded-2xl ${msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"}`}>
                    <div className="break-words text-sm">
                        {msg.role === 'assistant' ? (
                            <MemoizedMarkdown content={contentToRender} />
                        ) : (
                            <div className="whitespace-pre-wrap">{displayedContent}</div>
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

    // scroll to down when convert to a different conversation(message change)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length > 0) {
                scrollToBottom("auto");
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [messages]);

    // scroll to down when response typing
    useEffect(() => {
        if (isStreaming && !showScrollButton) {
            const timer = setTimeout(() => {
                scrollToBottom("smooth");
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [isStreaming, showScrollButton, messages]);

    const renderChatContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <Spinner className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            );
        }

        if (loadError) {
            return (
                <div className="flex justify-center items-center h-full text-red-500">
                    <p>{loadError}</p>
                </div>
            );
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

    // overflow-y-auto: when the content exceed the contain in y direction, show the scroll bar
    return (
        <main className="flex-1 flex flex-col relative min-h-0">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" ref={chatWindowRef} onScroll={onScroll}>
                <div className="max-w-4xl mx-auto">
                    {renderChatContent()}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {showScrollButton && (
                <button
                    onClick={() => scrollToBottom("smooth")}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity animate-fade-in"
                >
                    <ChevronDownIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                </button>
            )}

            <ChatInput onSendMessage={onSendMessage} isStreaming={isStreaming} isLoading={isLoading} />
        </main>
    );
});
ChatArea.displayName = "ChatArea";


// --- Main Page Component ---
export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [isConversationsLoading, setIsConversationsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [theme, setTheme] = useTheme("light");
    const { messages, isLoading: isMessagesLoading, isStreaming, error: chatError, sendMessage } = useChat(selectedConversationId);



    const fetchConversations = useCallback(async () => {
        try {
            const convs = await api.getConversations();
            setConversations(convs);
        } catch (err) {
            console.error("Failed to load conversations", err);
        } finally {
            setIsConversationsLoading(false);
        }
    }, []);

    // Fetch initial data
    useEffect(() => {
        setCurrentUser({ name: "He Guozhu" });
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        fetchConversations();
    }, [fetchConversations]);

    const handleSelectConversation = useCallback((id: number | null) => {
        if (selectedConversationId === id) return;
        setSelectedConversationId(id);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, [selectedConversationId]);

    const handleSendMessage = useCallback((message: string) => {
        const onNewConversationStarted = (newId: number) => {
            fetchConversations().then(() => {
                setSelectedConversationId(newId);
            });
        };
        sendMessage(message, onNewConversationStarted);
    }, [sendMessage, fetchConversations]);

    const handleLogout = async () => {
        await api.postLogout();
        setCurrentUser(null);
    };

    if (!currentUser) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <Spinner className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="dark:text-white">Loading...</p>
                </div>
            </div>
        );
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
                currentUser={currentUser}
                onLogout={handleLogout}
                onSetTheme={setTheme}
                theme={theme}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 md-hidden flex items-center">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon className="w-6 h-6"/>
                    </button>
                    <h1 className="text-lg font-semibold ml-4 truncate">
                        {selectedConversationId ? conversations.find(c => c.id === selectedConversationId)?.title : "New Chat"}
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