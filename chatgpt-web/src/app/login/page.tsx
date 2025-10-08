"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { LockIcon, UserIcon } from "@/components/ui/icons";
import { loginUser } from "@/api/client";
import { ApiError } from "@/api/types";

export default function LoginPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/chat");
    }
  }, [token, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(username, password);
      login(response.access_token);
    } catch (err) {
      let errMsg = "Failed to login, please try again later.";
      if (err instanceof ApiError) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          Welcome Back!
        </h1>
        <p className="text-center text-gray-500">Please log in to continue</p>
        {error && (
          <div
            className="p-3 text-sm text-red-700 bg-red-100 rounded-lg"
            role="alert"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <UserIcon />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <LockIcon />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Not have an account?
          <button
            onClick={() => router.push("/register")}
            className="font-medium text-blue-600 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </main>
  );
}
