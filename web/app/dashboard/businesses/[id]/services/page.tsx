import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BusinessServices from "@/components/modules/dashboard/business/BusinessService";

export default async function BusinessServicesPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (session?.user?.role === "Receiver") redirect("/dashboard");
  return <BusinessServices businessId={Number(params.id)} />;
}
