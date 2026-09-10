import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { getCurrentUser } from "@/features/auth/current-user";

/**
 * The authenticated shell.
 *
 * This is the REAL gate: it calls /auth/me, so a cookie holding a revoked or
 * expired token lands here and redirects. proxy.ts only checked that a cookie
 * existed.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider user={user}>
      {/* min-h-dvh rather than a percentage: a percentage min-height needs
          every ancestor to resolve a height, which left a dead band under the
          content. */}
      <div className="flex min-h-dvh">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          {/* A max width keeps line lengths and table density sane on wide
              monitors instead of stretching to 2560px. */}
          <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto w-full max-w-[90rem]">{children}</div>
          </main>
        </div>
      </div>

      <Toaster />
    </AuthProvider>
  );
}
