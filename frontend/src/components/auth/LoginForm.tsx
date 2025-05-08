"use client";

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("اسم المستخدم وكلمة المرور مطلوبان.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      const { token, admin } = response.data;
      login(token, admin);
      // Redirect is handled by AuthContext's login method
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
      console.error("Login error:", err);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="p-8 bg-white rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-700">تسجيل دخول المشرف</h2>
        
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label 
            htmlFor="username" 
            className="block mb-2 text-sm font-medium text-gray-600"
          >
            اسم المستخدم
          </label>
          <input 
            type="text" 
            id="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required 
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block mb-2 text-sm font-medium text-gray-600"
          >
            كلمة المرور
          </label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required 
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;

