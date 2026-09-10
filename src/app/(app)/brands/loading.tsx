import { ListPageSkeleton } from "@/components/ui/feedback";

/** Streamed while the server component fetches. Shaped like the real table so
 *  the layout does not jump when data arrives. */
export default function Loading() {
  return <ListPageSkeleton columns={4} />;
}
