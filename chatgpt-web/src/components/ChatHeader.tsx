import React, { memo } from "react";

import { MenuIcon } from "@/components/ui/icons";

export interface ChatHeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

export const ChatHeader = memo<ChatHeaderProps>(({ title, onOpenSidebar }) => {
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
