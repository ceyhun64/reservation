// hooks/use-dashboard-stats.ts
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getNotifications } from "@/lib/api/notifications.api";
import {
  getMyAppointments,
  getProviderAppointments,
} from "@/lib/api/appointments.api";

export function useDashboardStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ notifications: 0, appointments: 0 });

  useEffect(() => {
    if (!session?.token) return;

    const fetchStats = async () => {
      try {
        // Okunmamış bildirimleri çek
        const notifs = await getNotifications(true, session.token);

        // Bekleyen/Gelecek randevuları çek (Role göre)
        let appts;
        if (session.user.role === "Provider") {
          appts = await getProviderAppointments(
            { status: "Pending" },
            session.token,
          );
        } else {
          appts = await getMyAppointments(
            { status: "Confirmed" },
            session.token,
          );
        }

        setStats({
          notifications: notifs.data?.length || 0,
          appointments: appts.data?.totalCount || 0,
        });
      } catch (error) {
        console.error("Stats fetch error:", error);
      }
    };

    fetchStats();
    // 30 saniyede bir güncelleme (isteğe bağlı)
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return stats;
}
