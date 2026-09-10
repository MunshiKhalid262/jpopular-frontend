"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

/**
 * Segment error boundary for the authenticated app.
 *
 * Shows a readable recovery path instead of Next's default error screen. The
 * message itself is not rendered: a server-side failure can carry internal
 * detail, and in production Next replaces it with a digest anyway.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console for local debugging; a real deployment
    // would forward this to an error reporter.
    console.error("Application error:", error);
  }, [error]);

  return (
    <Card>
      <CardBody className="py-16">
        <EmptyState
          icon={<TriangleAlert />}
          title="Something went wrong"
          description="This page could not be loaded. Trying again often resolves it; if it persists, the API may be unavailable."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button variant="primary" size="sm" onClick={reset}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
              <ButtonLink href="/dashboard" variant="secondary" size="sm">
                Back to dashboard
              </ButtonLink>
            </div>
          }
        />

        {error.digest ? (
          <p className="mt-6 text-center text-xs text-fg-subtle">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
