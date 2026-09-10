"use client";

import { PencilLine, Power, PowerOff, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  RowActionsTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";
import { putJson } from "@/features/catalog/client";

/**
 * Row actions for a user.
 *
 * The backend owns the safety rules -- a user cannot deactivate themselves, and
 * the last active administrator cannot be deactivated or demoted (409 with
 * CANNOT_DEACTIVATE_SELF / LAST_ACTIVE_ADMIN). Where a rule is knowable up
 * front the action is disabled with an explanation, but the server's refusal is
 * still surfaced verbatim in the dialog if it fires.
 */
export function UserRowActions({
  userId,
  userName,
  isActive,
  isSelf,
}: {
  userId: number;
  userName: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);

  async function toggleStatus(): Promise<string | null> {
    const result = await putJson(`/users/${userId}/status`, { is_active: !isActive });

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success(isActive ? "User deactivated" : "User activated", {
      description: isActive
        ? `${userName} can no longer sign in, and existing sessions were ended.`
        : `${userName} can sign in again.`,
    });
    router.refresh();

    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <RowActionsTrigger label={`Actions for ${userName}`} />

        <DropdownMenuContent>
          <DropdownMenuItem
            icon={<PencilLine aria-hidden="true" />}
            onSelect={() => router.push(`/users/${userId}/edit`)}
          >
            Edit user
          </DropdownMenuItem>

          {isSelf ? (
            // Disabled with a reason rather than hidden, so the rule is
            // discoverable instead of the option mysteriously missing.
            <DropdownMenuItem icon={<ShieldAlert aria-hidden="true" />} disabled>
              Cannot deactivate yourself
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              tone={isActive ? "danger" : "default"}
              icon={isActive ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
              onSelect={(event) => {
                event.preventDefault();
                setStatusOpen(true);
              }}
            >
              {isActive ? "Deactivate user" : "Activate user"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tone={isActive ? "danger" : "primary"}
        title={isActive ? "Deactivate user?" : "Activate user?"}
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        description={
          isActive ? (
            <>
              <strong className="font-medium text-fg">{userName}</strong> will be
              signed out immediately and will not be able to sign in again. This
              is refused if they are the last active administrator.
            </>
          ) : (
            <>
              <strong className="font-medium text-fg">{userName}</strong> will be
              able to sign in again with their existing password.
            </>
          )
        }
        onConfirm={toggleStatus}
      />
    </div>
  );
}
