import React, { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SunIcon, MoonIcon, LogoutIcon } from "@/components/ui/icons";

export const UserPanel = memo(() => {
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
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
        <button onClick={logout} title="Logout" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700">
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
});
UserPanel.displayName = "UserPanel";