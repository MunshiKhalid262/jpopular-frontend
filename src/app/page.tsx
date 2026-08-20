import { redirect } from "next/navigation";

/**
 * There is no marketing page: JPopular is an internal tool. Signed-out visitors
 * are redirected to /login by middleware before reaching here.
 */
export default function RootPage() {
  redirect("/dashboard");
}
