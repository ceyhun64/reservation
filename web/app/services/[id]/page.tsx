// app/services/[id]/page.tsx
import React from "react";
import ServicesDetail from "@/components/modules/services/ServiceDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServicesDetailPage({ params }: Props) {
  const { id } = await params;
  return <ServicesDetail serviceId={Number(id)} />;
}
