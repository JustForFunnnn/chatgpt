import React, { useState, useEffect, useRef, useCallback, memo } from "react";

import { ScrollDownIcon, LoadingIcon } from "@/components/ui/icons";
import { Message } from "@/api/types";
import { ErrorInfo } from "./ErrorInfo";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

export interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  loadError: string | null;
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatArea = memo<ChatAreaProps>(
  ({ messages, isLoading, loadError, isStreaming, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = useCallback(
      (behavior: "smooth" | "auto" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
      },
      [],
    );

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
        const isScrolledToBottom =
          chatWindow.scrollHeight -
            chatWindow.scrollTop -
            chatWindow.clientHeight <
          150;
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
            <LoadingIcon />
          </div>
        );
      }
      if (loadError) {
        return <ErrorInfo message={loadError} />;
      }
      if (messages.length > 0) {
        return messages.map((msg, index) => {
          const isLastMessage = index === messages.length - 1;
          const isTyping =
            isStreaming && isLastMessage && msg.role === "assistant";
          return <MessageBubble key={msg.id} msg={msg} isTyping={isTyping} />;
        });
      }
      return <WelcomeScreen />;
    };

    return (
      <main className="flex-1 flex flex-col relative min-h-0">
        <div
          className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          ref={chatWindowRef}
          onScroll={onScroll}
        >
          <div
            className={`max-w-4xl mx-auto ${messages.length === 0 ? "h-full" : ""}`}
            ref={messagesContainerRef}
          >
            {renderChatContent()}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity animate-fade-in"
          >
            <ScrollDownIcon />
          </button>
        )}
        <ChatInput
          onSendMessage={onSendMessage}
          isStreaming={isStreaming}
          isLoading={isLoading}
        />
      </main>
    );
  },
);
ChatArea.displayName = "ChatArea";
