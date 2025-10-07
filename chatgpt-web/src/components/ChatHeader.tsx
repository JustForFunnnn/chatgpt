import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon, ErrorIcon } from "@/components/ui/icons";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client";
import { Conversation, Message, User } from "@/api/types";
import { UserPanel } from "./UserPanel"

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