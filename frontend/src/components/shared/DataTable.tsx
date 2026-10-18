import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Used in the stacked mobile layout instead of the header text. */
  mobileLabel?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  label: string
  dense?: boolean
}

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  label,
  dense,
}: DataTableProps<T>) {
  return (
    <>
      {/* Wide screens get the table, phones get stacked rows so nothing scrolls sideways. */}
      <div className="hidden md:block">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(ALIGN_CLASS[column.align ?? 'left'], column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                className={onRowClick ? 'cursor-pointer' : undefined}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      ALIGN_CLASS[column.align ?? 'left'],
                      dense && 'py-2',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn(
              'border-line bg-surface rounded-[8px] border p-4',
              onRowClick && 'cursor-pointer',
            )}
            onClick={() => onRowClick?.(row)}
          >
            <dl className="space-y-1.5">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="text-muted text-[12px]">
                      {column.mobileLabel ?? column.header}
                    </dt>
                    <dd
                      className={cn(
                        'text-ink text-[13px] font-medium',
                        ALIGN_CLASS[column.align ?? 'left'],
                      )}
                    >
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
