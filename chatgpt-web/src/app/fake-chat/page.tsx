// chat page

"use client";

// The alias '@' was replaced with a relative path.
// Please adjust '../../contexts/AuthContext' if your folder structure is different.
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatPage() {
    const { token, user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [token, isLoading, router]);

    const handleLogout = () => {
        logout();
    };

    // 在加载期间或 token 不存在时，显示加载状态
    if (isLoading || !token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
             <div className="w-full max-w-2xl text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Welcome to the Chat Room!</h1>
                <p className="text-gray-600 mb-8">Hi, {user?.username}. You have successfully logged in. This is a protected page.</p>
                <button
                    onClick={handleLogout}
                    className="px-6 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                    Logout
                </button>
            </div>
        </main>
    );
}

