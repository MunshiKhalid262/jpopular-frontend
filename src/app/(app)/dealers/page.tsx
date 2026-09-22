import type { Metadata } from "next";

import { CustomerDirectory } from "@/features/invoicing/components/CustomerDirectory";

export const metadata: Metadata = { title: "Dealers" };

export default async function DealersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  return <CustomerDirectory type="dealer" searchParams={await searchParams} />;
}
