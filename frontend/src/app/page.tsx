"use client";

import AuthenticatedLayout from "./(main)/layout";
import DashboardPage from "./(main)/page";

export default function HomePage() {
  return (
    <AuthenticatedLayout>
      <DashboardPage />
    </AuthenticatedLayout>
  );
}

