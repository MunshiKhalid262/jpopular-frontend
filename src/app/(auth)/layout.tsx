/**
 * Unauthenticated shell: no sidebar, no top bar. The login page owns the whole
 * viewport so it can use a split-panel composition.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-canvas">{children}</div>;
}
