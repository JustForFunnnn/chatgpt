"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import {  LockIcon, UserIcon } from '@/components/ui/icons'
import { registerUser } from "@/api/client"

export default function RegisterPage() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => router.replace("/login"), 3000);
            return () => clearTimeout(t);
        }
    }, [success, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('The passwords do not match.');
            return;
        }

        setLoading(true);
        
        try {
            await registerUser(username, password)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
            {
                success && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-sm rounded-xl">
                    <div className="text-center space-y-3" aria-live="assertive">
                    <div className="mx-auto h-10 w-10 rounded-full bg-green-100 grid place-items-center">
                        <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600">
                        <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Registered successfully</h2>
                    <p className="text-sm text-gray-600">Redirecting to login…</p>
                    </div>
                </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">Create an Account</h1>
            <p className="text-center text-gray-500">Start your journey now!</p>
            {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}
            {success && <div className="p-3 text-sm text-green-700 bg-green-100 rounded">Register success. Redirecting to login page...</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><UserIcon /></div><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (3-20 characters)" required minLength={3} maxLength={20} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" /></div>
                <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockIcon /></div><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6-40 characters)" required minLength={6} maxLength={40} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" /></div>
                <div className="relative"><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><LockIcon /></div><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required minLength={6} maxLength={40} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" /></div>
                <button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 transition-colors">{loading ? 'Creating...' : 'Sign Up'}</button>
            </form>
            <p className="text-sm text-center text-gray-600">
                Already have an account? <button onClick={() => router.push('/login')} className="font-medium text-blue-600 hover:underline">Login</button>
            </p>
        </div>
        </main>
    );
}

