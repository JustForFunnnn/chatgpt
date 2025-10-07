import React, { memo } from "react";

import { CloseIcon, NewIcon } from "@/components/ui/icons";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

import { Conversation } from "@/api/types";
import { ErrorInfo } from "./ErrorInfo";
import { UserPanel } from "./UserPanel";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: number | null) => void;
  conversations: Conversation[];
  selectedId: number | null;
  isLoading: boolean;
  loadError: string | null;
}

export const Sidebar = memo<SidebarProps>(({ isOpen, onClose, onSelectConversation, conversations, selectedId, isLoading, loadError }) => (
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
              {conv.title}
            </div>
          ))
        )}
      </div>
      <UserPanel />
    </div>
  </>
));
Sidebar.displayName = "Sidebar";
