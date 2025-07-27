// src/components/data-table-reusable.tsx
// This is the REFACTORED version of your provided data-table.tsx
// It is now generic and reusable for different data types.

'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconLayoutColumns,
  IconDownload // Added Download Icon
} from '@tabler/icons-react'; // Kept essential icons

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState, // Renamed from ColumnVisibility as per previous correction
} from '@tanstack/react-table';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem, // Added for master download options
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// --- Reusable Drag Handle Component ---
// This is specific to drag-and-drop functionality, kept as provided
function DragHandle<TData extends { id: UniqueIdentifier }>({ id }: { id: TData['id'] }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// --- Reusable Draggable Row Component ---
// This is specific to drag-and-drop functionality, kept as provided
function DraggableRow<TData extends { id: UniqueIdentifier }>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// --- DataTable Component (Main Export) ---
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  reportTitle: string; // Title for download notifications/filtering
  filterColumnAccessorKey?: string; // Optional key for the column to filter by (e.g., "clientName")
  onDownloadAll: (format: 'csv' | 'xlsx') => Promise<void>;
  enableRowDragging?: boolean; // New prop to enable/disable row dragging
  onRowOrderChange?: (newOrder: TData[]) => void; // Callback for when row order changes
}

export function DataTableReusable<TData extends { id: UniqueIdentifier }, TValue>({
  columns,
  data: initialData, // Renamed to initialData as internal state will manage it
  reportTitle,
  filterColumnAccessorKey,
  onDownloadAll,
  enableRowDragging = false, // Default to false
  onRowOrderChange,
}: DataTableProps<TData, TValue>) {
  const [data, setData] = React.useState(() => initialData); // Internal state for data to support drag-and-drop
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({}); // Corrected type
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Update internal data state when initialData prop changes
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(), // Ensure row.id is a string UniqueIdentifier
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Handle drag-and-drop reordering
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const newOrderedData = arrayMove(
        data,
        dataIds.indexOf(active.id),
        dataIds.indexOf(over.id)
      );
      setData(newOrderedData);
      onRowOrderChange?.(newOrderedData); // Callback for parent to save new order if needed
    }
  }

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    try {
      await onDownloadAll(format);
      toast.success('Download Initiated', {
        description: `Your ${reportTitle} report in ${format.toUpperCase()} format is being prepared.`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download Failed', {
        description: 'There was an error preparing your download. Please try again.',
      });
    }
  };


  return (
    <div className="w-full flex-col justify-start gap-6"> {/* Removed Tabs wrapper */}
      <div className="flex items-center py-4 justify-between">
        {filterColumnAccessorKey && table.getColumn(filterColumnAccessorKey) && (
          <Input
            placeholder={`Filter ${reportTitle} by ${filterColumnAccessorKey}...`}
            value={(table.getColumn(filterColumnAccessorKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumnAccessorKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm bg-input text-foreground border-border placeholder:text-muted-foreground"
          />
        )}
        <div className="flex items-center gap-2 ml-auto"> {/* Aligned right */}
          {/* Master Download Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-secondary text-secondary-foreground border-border hover:bg-secondary/80">
                <IconDownload className="mr-2 h-4 w-4" /> Download All <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem onClick={() => handleDownload('csv')}>
                Download as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('xlsx')}>
                Download as XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover text-popover-foreground border-border">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {/* Dynamic column name display (simplified for generic use) */}
                      {column.columnDef.header?.toString() || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Assuming "Add Salesperson" button is for a specific page, not generic DataTable */}
          {/* <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Salesperson</span>
          </Button> */}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10 text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-border">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8 text-foreground">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    // Render draggable row only if enabled
                    enableRowDragging ? (
                      <DraggableRow key={row.id} row={row} />
                    ) : (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-border hover:bg-accent hover:text-accent-foreground"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20 bg-input text-foreground border-border">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-popover text-popover-foreground border-border">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}