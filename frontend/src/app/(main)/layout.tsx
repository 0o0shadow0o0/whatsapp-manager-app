"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect, ReactNode } from "react";

// This component will wrap authenticated routes and handle redirection if not logged in.
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { admin, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/login");
    }
  }, [admin, isLoading, router, token]);

  if (isLoading || !admin) {
    // You can show a global loading spinner here
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>جاري تحميل الصفحة...</p>
        {/* Or a more sophisticated loader component */}
      </div>
    );
  }

  return <>{children}</>;
};

// Main application layout for authenticated users
const MainAppLayout = ({ children }: { children: ReactNode }) => {
  // TODO: Implement Sidebar and Header components here
  // For now, a simple structure:
  const { admin, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <div className="text-xl font-semibold">لوحة التحكم</div>
        <nav>
          <ul>
            <li><a href="/" className="block py-2 px-3 hover:bg-gray-700 rounded">الرئيسية/الدردشات</a></li>
            <li><a href="/auto-replies" className="block py-2 px-3 hover:bg-gray-700 rounded">الردود التلقائية</a></li>
            {/* Add more navigation links here as needed */}
          </ul>
        </nav>
        <div className="mt-auto">
          {admin && <p className="text-sm">مرحباً, {admin.username}</p>}
          <button 
            onClick={logout} 
            className="w-full mt-2 py-2 px-3 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainAppLayout>
          {children}
        </MainAppLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

