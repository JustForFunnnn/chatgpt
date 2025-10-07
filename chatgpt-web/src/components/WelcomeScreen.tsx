import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon, ErrorIcon } from "@/components/ui/icons";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client";
import { Conversation, Message, User } from "@/api/types";
import { UserPanel } from "./UserPanel"


export const WelcomeScreen: FC = () => (
  <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
    <h2 className="text-2xl font-bold">Start Chatting</h2>
    <p>Select a conversation from your history or start a new one.</p>
  </div>
);
