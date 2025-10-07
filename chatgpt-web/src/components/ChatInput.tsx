import React, { useState, useRef, FormEvent, memo, ChangeEvent } from "react";

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  isLoading: boolean;
}

export const ChatInput = memo<ChatInputProps>(({ onSendMessage, isStreaming, isLoading }) => {
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
