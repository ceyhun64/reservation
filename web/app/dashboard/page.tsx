import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BusinessDashboard from "@/components/modules/dashboard/business/BusinessDashboard";
import ReceiverDashboard from "@/components/modules/dashboard/receiver/ReceiverDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const role = session.user?.role;
  return role === "Provider" || role === "Admin" ? (
    <BusinessDashboard />
  ) : (
    <ReceiverDashboard />
  );
}
