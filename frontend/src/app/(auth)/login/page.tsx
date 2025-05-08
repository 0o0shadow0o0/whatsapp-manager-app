"use client";

import LoginForm from "@/components/auth/LoginForm";
import { AuthProvider } from "@/contexts/AuthContext"; // Ensure AuthProvider wraps this page or a parent layout
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This component ensures that if a user is already logged in, they are redirected away from the login page.
const LoginPageContent = () => {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && admin) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [admin, isLoading, router]);

  if (isLoading || admin) {
    // Show a loading spinner or null while checking auth status or redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return <LoginForm />;
};

export default function LoginPage() {
  return (
    <AuthProvider> {/* It's often better to place AuthProvider in a higher-level layout */}
      <LoginPageContent />
    </AuthProvider>
  );
}

