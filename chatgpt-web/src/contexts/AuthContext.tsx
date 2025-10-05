"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, FC } from 'react';
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"

/**
 * User information decoded from the JWT token.
 */
interface UserPayload {
    sub: string;
    username: string;
}

/**
 * @interface AuthContextType
 * @property {string | null} token - The current user's authentication token, or null if not logged in.
 * @property {UserPayload | null} user - The current user's info, or null if not logged in.
 * @property {(token: string) => void} login - Handles the logic after a successful login (sets token and navigates).
 * @property {() => void} logout - Handles the logout logic (clears token and navigates).
 * @property {boolean} isLoading - A boolean indicating if the context is still performing the initial load from localStorage.
 */
interface AuthContextType {
    token: string | null;
    user: UserPayload | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "accessToken";

/**
 * AuthProvider component that provides authentication state and management functions to the entire application.
 */
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserPayload | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    const isExpired = (exp: number): boolean => {
        return Date.now() >= exp * 1000;
    };

    const handleTokenChange = (newToken: string | null) => {
        setToken(newToken);
        if (newToken) {
            try {
                const decodedUser = jwtDecode<UserPayload>(newToken);
                setUser(decodedUser);
                localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
            } catch (error) {
                console.error("Failed to decode JWT:", error);
                setUser(null);
                setToken(null);
                localStorage.removeItem(ACCESS_TOKEN_KEY);
            }
        } else {
            // logout
            setUser(null);
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
    };

    // Synchronizes authentication state from localStorage when the component first loads.
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
            handleTokenChange(storedToken);
        } catch (error) {
            console.error("Failed to access localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * This function is called after a successful login.
     * @param {string} newToken - The new access token obtained from the API.
     */
    const login = (newToken: string) => {
        handleTokenChange(newToken);
        router.replace('/fake-chat'); // TODO update
    };
    
    /**
     * Call this function to log out the user.
     */
    const logout = () => {
        handleTokenChange(null);
        router.replace('/login');
    };

    const value = { token, user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * A custom hook for easy access to the authentication context within components.
 * @returns {AuthContextType} The context object containing token, login, logout, and isLoading.
 */
export const useAuth = (): AuthContextType => {
    // useContext(AuthContext) traverses up the component tree to find the nearest <AuthContext.Provider>.
    // If it reaches the top without finding a provider, it returns the default value provided
    // during context creation, which is `undefined` in this case.
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

