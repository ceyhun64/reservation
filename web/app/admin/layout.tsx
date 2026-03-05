"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/modules/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Eğer sadece "/admin" ise sidebar'ı gösterme
  const showSidebar = pathname !== "/admin";

  return (
    <div className="min-h-screen bg-muted/30">
      {showSidebar && <AdminSidebar />}
      <main className={`${showSidebar ? "md:ml-60" : ""} min-h-screen`}>
        <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
