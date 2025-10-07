import React, { useState, useEffect, useRef, FormEvent, useCallback, memo, FC, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { MenuIcon, SunIcon, MoonIcon, ChevronDownIcon, Spinner, LogoutIcon, CloseIcon, NewIcon, ErrorIcon } from "@/components/ui/icons";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as api from "@/api/client";
import { Conversation, Message, User } from "@/api/types";
import { UserPanel } from "./UserPanel"


export const ErrorInfo = ({ message }: { message: string }) => (
  <div className="p-3 h-full flex flex-row justify-center items-center text-red-500 dark:text-red-400">
    <ErrorIcon className="w-5 h-5 mr-2 flex-shrink-0" />
    <p className="text-sm font-semibold">{message}</p>
  </div>
);