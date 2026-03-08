"use client";

import React from "react";
import { useParams } from "next/navigation";
import ServicesDetail from "@/components/modules/dashboard/business/ServiceDetail";

export default function ServicesDetailPage() {
  return <ServicesDetail serviceId={Number(useParams().id)} />;
}
