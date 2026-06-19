import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import {
  uiTableHeaderMutedClass,
  uiTableWrapCabinetClass,
  uiTableWrapPublicClass,
} from "@/lib/ui-surfaces";

const tableWrapVariants = cva("overflow-x-auto border border-gray-100", {
  variants: {
    variant: {
      public: "rounded-2xl",
      cabinet: "rounded-3xl",
      admin: "rounded-3xl",
    },
  },
  defaultVariants: { variant: "cabinet" },
});

export interface TableWrapProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tableWrapVariants> {}

/** Обёртка таблицы с единым радиусом и рамкой (кабинет / админ / публичная сторона). */
export function TableWrap({ className, variant, children, ...props }: TableWrapProps) {
  return (
    <div className={cn(tableWrapVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

/** Алиас для кабинета и админки */
export function CabinetTableWrap({
  className,
  children,
  ...props
}: Omit<TableWrapProps, "variant">) {
  return (
    <TableWrap variant="cabinet" className={className} {...props}>
      {children}
    </TableWrap>
  );
}

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100 transition-colors hover:bg-gray-50/80 data-[state=selected]:bg-gray-50",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-sm font-medium text-slate [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-4 align-middle text-sm [&:has([role=checkbox])]:pr-0", className)} {...props} />
  );
}

/** Класс заголовка строк таблицы в кабинете */
export const cabinetTableHeaderClass = uiTableHeaderMutedClass;

/** Legacy class strings — совпадают с TableWrap variant */
export const cabinetTableWrapClass = uiTableWrapCabinetClass;
export const publicTableWrapClass = uiTableWrapPublicClass;

export { tableWrapVariants };
