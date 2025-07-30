"use client"

import * as React from "react"
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
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconUser, // Added for salesperson icon
  IconMapPin, // Added for territory icon
  IconCalendarCheck, // Added for visits icon
  IconReport, // Added for DVR icon
  IconCurrencyRupee, // Added for currency icon (assuming INR based on previous context)
  IconGauge, // Added for target achievement
  IconClock, // Added for last activity
} from "@tabler/icons-react"
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
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
//import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// --- 1. UPDATED SCHEMA FOR SALESPERSON DATA ---
export const schema = z.object({
  id: z.number(),
  salespersonName: z.string(),
  employeeId: z.string().optional(),
  assignedTerritory: z.string(),
  completedVisitsThisWeek: z.number(),
  dvrSubmittedToday: z.number(),
  leadsGeneratedThisMonth: z.number(),
  salesValueClosedThisMonth: z.number(),
  targetAchievement: z.number(), // Percentage 0-100
  lastActivity: z.string(), // Could be a Date object or string
  status: z.string(), // e.g., "Active", "On Leave"
})

// Create a separate component for the drag handle (retained)
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// --- 2. REDEFINED COLUMNS FOR SALESPERSON TABLE ---
const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "salespersonName",
    header: "Salesperson Name",
    cell: ({ row }) => {
      // Use TableCellViewer to show salesperson details on click
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "assignedTerritory",
    header: "Assigned Territory",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <IconMapPin className="size-4 text-muted-foreground" />
        <span className="truncate">{row.original.assignedTerritory}</span>
      </div>
    ),
  },
  {
    accessorKey: "completedVisitsThisWeek",
    header: () => <div className="text-center">Visits (This Week)</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1.5">
        <IconCalendarCheck className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.completedVisitsThisWeek}</span>
      </div>
    ),
  },
  {
    accessorKey: "dvrSubmittedToday",
    header: () => <div className="text-center">DVR (Today)</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-1.5">
        <IconReport className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.dvrSubmittedToday}</span>
      </div>
    ),
  },
  {
    accessorKey: "leadsGeneratedThisMonth",
    header: "Leads (This Month)",
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.leadsGeneratedThisMonth}</div>
    ),
  },
  {
    accessorKey: "salesValueClosedThisMonth",
    header: () => <div className="text-right">Sales Value (This Month)</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        <IconCurrencyRupee className="inline-block size-4 align-text-bottom" />
        {row.original.salesValueClosedThisMonth.toLocaleString("en-IN")}
      </div>
    ),
  },
  {
    accessorKey: "targetAchievement",
    header: () => <div className="text-center">Target Achieved</div>,
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex w-fit items-center justify-center gap-1.5 px-2 py-0.5 mx-auto"
      >
        <IconGauge className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.targetAchievement}%</span>
      </Badge>
    ),
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconClock className="size-4" />
        {row.original.lastActivity}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColorClass = status === "Active" ? "bg-green-500/20 text-green-700" :
                               status === "On Leave" ? "bg-orange-500/20 text-orange-700" :
                               "bg-muted-foreground/20 text-muted-foreground"; // Default for others

      return (
        <Badge
          variant="outline"
          className={`flex w-fit items-center gap-1.5 px-2 py-0.5 ${statusColorClass}`}
        >
          {status === "Active" && <IconCircleCheckFilled className="size-3 fill-current" />}
          {status === "On Leave" && <IconLoader className="size-3 animate-spin" />}
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>View Reports</DropdownMenuItem>
          <DropdownMenuItem>Assign Task</DropdownMenuItem>
          <DropdownMenuItem>Edit Profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

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
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

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
    getRowId: (row) => row.id.toString(),
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
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      // --- Adjusted default tab value ---
      defaultValue="sales-team-overview"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="sales-team-overview"> {/* Adjusted default value */}
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            {/* --- Adjusted Select Items for Mobile/Small Screens --- */}
            <SelectItem value="sales-team-overview">Sales Team Overview</SelectItem>
            <SelectItem value="lead-management">Lead Management</SelectItem>
            <SelectItem value="client-accounts">Client Accounts</SelectItem>
            <SelectItem value="reports-submitted">Reports Submitted</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          {/* --- Adjusted Tabs for Larger Screens --- */}
          <TabsTrigger value="sales-team-overview">Sales Team Overview</TabsTrigger>
          <TabsTrigger value="lead-management">Lead Management</TabsTrigger>
          <TabsTrigger value="client-accounts">Client Accounts</TabsTrigger>
          <TabsTrigger value="reports-submitted">Reports Submitted</TabsTrigger>
          {/* Add Badges if you have counts for these sections, like in your original "Past Performance" */}
          {/* Example: <TabsTrigger value="lead-management">Lead Management <Badge variant="secondary">12</Badge></TabsTrigger> */}
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                      {/* Dynamically display readable column names */}
                      {column.id === "salespersonName" && "Salesperson Name"}
                      {column.id === "employeeId" && "Employee ID"}
                      {column.id === "assignedTerritory" && "Assigned Territory"}
                      {column.id === "completedVisitsThisWeek" && "Visits (This Week)"}
                      {column.id === "dvrSubmittedToday" && "DVR (Today)"}
                      {column.id === "leadsGeneratedThisMonth" && "Leads (This Month)"}
                      {column.id === "salesValueClosedThisMonth" && "Sales Value (This Month)"}
                      {column.id === "targetAchievement" && "Target Achieved (%)"}
                      {column.id === "lastActivity" && "Last Activity"}
                      {column.id === "status" && "Status"}
                      {/* Fallback for any unmapped IDs, though ideally all should be mapped */}
                      {!["salespersonName", "employeeId", "assignedTerritory", "completedVisitsThisWeek", "dvrSubmittedToday", "leadsGeneratedThisMonth", "salesValueClosedThisMonth", "targetAchievement", "lastActivity", "status"].includes(column.id) && column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            {/* Changed "Add Section" to "Add Salesperson" */}
            <span className="hidden lg:inline">Add Salesperson</span>
          </Button>
        </div>
      </div>
      {/* --- Main Sales Team Overview Tab --- */}
      <TabsContent
        value="sales-team-overview" // Changed from "outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
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
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
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
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
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
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
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
      </TabsContent>
      {/* --- Other Tab Contents (Currently placeholders) --- */}
      <TabsContent
        value="lead-management" // Changed value
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Lead Management content will go here.
        </div>
      </TabsContent>
      <TabsContent
        value="client-accounts" // Changed value
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Client Accounts content will go here.
        </div>
      </TabsContent>
      <TabsContent
        value="reports-submitted" // Changed value
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
          Reports Submitted content will go here.
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Re-evaluate chart data if still relevant for salesperson details
// For now, keeping the original chartData and chartConfig, but they might need
// to be tied to actual salesperson performance data.
const chartData = [
  { month: "Jan", visits: 186, leads: 80 },
  { month: "Feb", visits: 305, leads: 200 },
  { month: "Mar", visits: 237, leads: 120 },
  { month: "Apr", visits: 73, leads: 190 },
  { month: "May", visits: 209, leads: 130 },
  { month: "Jun", visits: 214, leads: 140 },
]

const chartConfig = {
  visits: {
    label: "Visits",
    color: "hsl(var(--primary))",
  },
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-2))", // Using another chart color
  },
} satisfies ChartConfig

// --- MODIFIED TableCellViewer for Salesperson Details ---
function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.salespersonName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-2">
            <IconUser className="size-6" />
            {item.salespersonName}
          </DrawerTitle>
          <DrawerDescription>
            Detailed view for {item.salespersonName}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              {/* Chart adjusted for salesperson data concept */}
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData} // Replace with actual salesperson trend data
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="visits"
                    type="natural"
                    fill="var(--color-visits)"
                    fillOpacity={0.6}
                    stroke="var(--color-visits)"
                    stackId="a"
                  />
                  <Area
                    dataKey="leads"
                    type="natural"
                    fill="var(--color-leads)"
                    fillOpacity={0.4}
                    stroke="var(--color-leads)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Sales performance trending up! <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  This chart represents a hypothetical trend of visits and leads for {item.salespersonName} over the last six months.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="salespersonName">Salesperson Name</Label>
              <Input id="salespersonName" defaultValue={item.salespersonName} />
            </div>
            {item.employeeId && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" defaultValue={item.employeeId} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="assignedTerritory">Assigned Territory</Label>
                <Input id="assignedTerritory" defaultValue={item.assignedTerritory} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="completedVisitsThisWeek">Visits (This Week)</Label>
                <Input id="completedVisitsThisWeek" defaultValue={item.completedVisitsThisWeek} type="number" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="dvrSubmittedToday">DVR (Today)</Label>
                <Input id="dvrSubmittedToday" defaultValue={item.dvrSubmittedToday} type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="leadsGeneratedThisMonth">Leads (This Month)</Label>
                <Input id="leadsGeneratedThisMonth" defaultValue={item.leadsGeneratedThisMonth} type="number" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="salesValueClosedThisMonth">Sales Value Closed (This Month)</Label>
                <Input id="salesValueClosedThisMonth" defaultValue={item.salesValueClosedThisMonth} type="number" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="targetAchievement">Target Achievement (%)</Label>
              <Input id="targetAchievement" defaultValue={item.targetAchievement} type="number" />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="lastActivity">Last Activity</Label>
              <Input id="lastActivity" defaultValue={item.lastActivity} />
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}