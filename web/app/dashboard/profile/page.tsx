import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserProfile from "@/components/modules/dashboard/Profile"; // İsmi UserProfile olarak güncellediğini varsayıyorum
import TwoFactorSetUp from "@/components/modules/auth/TwoFactorSetup"; // 2FA bileşenini ekleyelim

export default async function ProfilePage() {
  const session = await auth();

  // 1. Hiç giriş yapılmamışsa login'e veya dashboard'a at
  if (!session) {
    redirect("/login");
  }

  // 2. Rol kontrolünü genişletiyoruz:
  // Sadece "Receiver" VEYA "Provider" olanlar girebilir.
  const allowedRoles = ["Receiver", "Provider", "Admin"];

  if (!session.user?.role || !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Artık her iki rol de bu bileşeni görebilir
  return (
    <div>
      <UserProfile />
      <TwoFactorSetUp />
    </div>
  );
}
