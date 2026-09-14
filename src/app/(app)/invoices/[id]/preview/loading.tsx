import { ListPageSkeleton } from "@/components/ui/feedback";

/** Streamed while the server component fetches. */
export default function Loading() {
  return <ListPageSkeleton columns={7} />;
}
