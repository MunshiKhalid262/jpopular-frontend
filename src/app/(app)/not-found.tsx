import { FileQuestion } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

/**
 * Rendered when a record does not exist -- reached via notFound() from a detail
 * or edit page, including when the API returns 404 for an archived record.
 */
export default function AppNotFound() {
  return (
    <Card>
      <CardBody className="py-16">
        <EmptyState
          icon={<FileQuestion />}
          title="Not found"
          description="This record does not exist, or it has been archived and is no longer available."
          action={
            <ButtonLink href="/dashboard" variant="secondary" size="sm">
              Back to dashboard
            </ButtonLink>
          }
        />
      </CardBody>
    </Card>
  );
}
