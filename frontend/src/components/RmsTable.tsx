import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  type TableProps,
} from "@heroui/react";
import type { RmsColumnType, RmsRowType } from "../types/components_type";
import { isEmpty } from "es-toolkit/compat";

interface RmsTableProps<T extends RmsRowType> {
  columns: RmsColumnType<T>[];
  data: T[];
  isLoading: boolean;
  className?: string;
  emptyContent: React.ReactNode;
}

export const RmsTable = <T extends RmsRowType>({
  columns,
  data,
  isLoading,
  className,
  emptyContent,
  classNames = {},
  ...props
}: RmsTableProps<T> &
  TableProps & { classNames?: TableProps["classNames"] }) => {
  return (
    <Table
      isHeaderSticky
      aria-label="Rms-Table"
      className={`${className}`}
      classNames={{
        ...classNames,
        table: "flex-1",
        base: isEmpty(data) ? `[&>div]:flex-1` : `[&>div]:flex-1`,
      }}
      {...props}
    >
      <TableHeader columns={columns}>
        {(column: RmsColumnType<T>) => (
          <TableColumn
            key={column.key}
            align="center"
            width={(column as any).width}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>

      <TableBody items={data} emptyContent={emptyContent} className="h-full">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.loadingRenderer ? (
                      column.loadingRenderer()
                    ) : (
                      <Spinner size="sm" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          : (row: T) => (
              <TableRow key={String(row.id) || Math.random().toString()}>
                {(columnKey: React.Key) => (
                  <TableCell key={columnKey}>
                    {(() => {
                      const column = columns.find((c) => c.key === columnKey);
                      if (column?.renderer) {
                        return column.renderer(row);
                      }
                      const value = row[columnKey as keyof T];
                      return value !== null && value !== undefined
                        ? String(value)
                        : "-";
                    })()}
                  </TableCell>
                )}
              </TableRow>
            )}
      </TableBody>
    </Table>
  );
};
