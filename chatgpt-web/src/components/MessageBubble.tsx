import React, { useState, useEffect, memo } from "react";
import { Message } from "@/api/types";

import { formatTimestamp } from "@/libs/utils";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

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
