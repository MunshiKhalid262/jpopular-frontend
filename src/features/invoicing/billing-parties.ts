import type { Customer } from "@/features/invoicing/types";
import { apiFetch } from "@/lib/server-api";

const PER_PAGE = 100;

/**
 * Everyone who can be billed on an invoice: dealers and customers alike.
 *
 * Fetched as two pages rather than one, because the API caps a page at 100.
 * A shop with more than 100 walk-ins would otherwise push its dealers off the
 * end of a single list, and the dealer picker would look broken for no visible
 * reason. Two calls give dealers -- far fewer, and the ones the prefill depends
 * on -- a page of their own.
 */
export async function loadBillingParties(): Promise<Customer[]> {
  const [dealers, customers] = await Promise.all([
    apiFetch<Customer[]>(`/customers?per_page=${PER_PAGE}&is_active=1&type=dealer`),
    apiFetch<Customer[]>(`/customers?per_page=${PER_PAGE}&is_active=1&type=customer`),
  ]);

  return [...dealers.data, ...customers.data];
}
