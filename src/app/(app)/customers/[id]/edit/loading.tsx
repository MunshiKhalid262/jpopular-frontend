import { FormPageSkeleton } from "@/components/ui/feedback";

/** Streamed while the server component fetches. Shaped like the real form so
 *  the layout does not jump when data arrives. */
export default function Loading() {
  return <FormPageSkeleton />;
}
