import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminTableRowsSkeleton } from "@/components/ui/skeleton";

interface AdminTableStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

interface AdminTableStateProps {
  loading: boolean;
  isEmpty: boolean;
  colSpan: number;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: AdminTableStateAction;
  emptySecondaryAction?: AdminTableStateAction;
  skeletonColumns?: number;
  skeletonRows?: number;
}

export function AdminTableState({
  loading,
  isEmpty,
  colSpan,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptySecondaryAction,
  skeletonColumns,
  skeletonRows = 5,
}: AdminTableStateProps) {
  if (loading) {
    return <AdminTableRowsSkeleton columns={skeletonColumns ?? colSpan} rows={skeletonRows} />;
  }

  if (isEmpty) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          <EmptyState
            variant="admin"
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
            secondaryAction={emptySecondaryAction}
            bordered={false}
          />
        </td>
      </tr>
    );
  }

  return null;
}
