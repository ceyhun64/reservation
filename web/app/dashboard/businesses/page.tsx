import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BusinessList from "@/components/modules/dashboard/business/BusinessList";

export default async function BusinessesPage() {
  const session = await auth();
  if (session?.user?.role === "Receiver") redirect("/dashboard");
  return <BusinessList />;
}
