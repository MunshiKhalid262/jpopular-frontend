import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { getCurrentUser } from "@/features/auth/current-user";

/**
 * The authenticated shell.
 *
 * This is the REAL gate: it calls /auth/me, so a cookie holding a revoked or
 * expired token lands here and redirects. Middleware only checked that a cookie
 * existed.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider user={user}>
      <div className="flex min-h-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
