"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"; // URL kontrolü için eklendi
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardBottomBar from "@/components/layout/BottomBar";
import { cn } from "@/lib/utils";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // URL "/admin" ile başlıyorsa true döner
  const isAdminPage = pathname?.startsWith("/admin");
  const isLoggedIn = status === "authenticated" && !!session;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin sayfası değilse Navbar'ı göster */}
      {!isAdminPage && <Navbar />}

      <main
        className={cn(
          "flex-1 w-full mx-auto",
          // Admin sayfasındaysa padding'i kaldırabilir veya farklı yönetebiliriz
          isAdminPage ? "p-0" : "p-16",
        )}
      >
        {children}
      </main>

      {/* Admin sayfası değilse Footer'ı göster */}
      {!isAdminPage && <Footer />}

      {/* Admin sayfası değilse VE giriş yapılmışsa BottomBar'ı göster */}
      {!isAdminPage && isLoggedIn && <DashboardBottomBar />}
    </div>
  );
}
