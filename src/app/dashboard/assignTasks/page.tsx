// src/app/dashboard/assignTasks/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ColumnDef } from '@tanstack/react-table';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/multi-select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";
import { DataTableReusable } from '@/components/data-table-reusable';
// Define the valid regions and areas
import { useDealerLocations } from '@/components/reusable-dealer-locations';
import { dailyTaskSchema } from "@/lib/shared-zod-schema";

// --- Zod Schemas for Data and Form Validation ---

// Schema for fetching salesmen and dealers (from GET response)
const salesmanSchema = z.object({
  id: z.number().int(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email(),
  salesmanLoginId: z.string().nullable(),
});

const dealerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

type Salesman = z.infer<typeof salesmanSchema>;
type Dealer = z.infer<typeof dealerSchema>;
type DailyTaskRecord = z.infer<typeof dailyTaskSchema>; // Type for records fetched from GET API

// Schema for form submission validation - UPDATED for MultiSelect and Area/Region
const assignTaskFormSchema = z.object({
  salesmanUserIds: z.array(z.number().int()).min(1, "Please select at least one salesman."),
  taskDate: z.date({
    error: "A task date is required.",
  }),
  visitType: z.enum(["Client Visit", "Technical Visit"]),  // strict types when assigning tasks
  relatedDealerIds: z.array(z.string().uuid()).optional(), // Changed to array for multi-select
  siteName: z.string().min(1, "Site name is required for Technical Visit.").optional(),
  description: z.string().optional(),
  area: z.string().optional(),
  region: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation based on visitType - UPDATED for multi-select
  if (data.visitType === "Client Visit") {
    if (!data.relatedDealerIds || data.relatedDealerIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one client is required for Client Visit.",
        path: ['relatedDealerIds'],
      });
    }
    if (data.siteName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Site name should not be provided for Client Visit.",
        path: ['siteName'],
      });
    }
  } else if (data.visitType === "Technical Visit") {
    if (!data.siteName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Site name is required for Technical Visit.",
        path: ['siteName'],
      });
    }
    if (data.relatedDealerIds && data.relatedDealerIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Clients should not be provided for Technical Visit.",
        path: ['relatedDealerIds'],
      });
    }
  }
});

export default function AssignTasksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [tasks, setTasks] = useState<DailyTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);
  const [errorFetchingData, setErrorFetchingData] = useState<string | null>(null);

  // Form State - UPDATED with selectedDealers, selectedArea, and selectedRegion
  const [selectedSalesmen, setSelectedSalesmen] = useState<number[]>([]);
  const [taskDate, setTaskDate] = useState<Date | undefined>(undefined);
  const [visitType, setVisitType] = useState<"Client Visit" | "Technical Visit" | "">("");
  const [selectedDealers, setSelectedDealers] = useState<string[]>([]); // Array for multi-select
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { locations, loading: locationsLoading, error: locationsError } = useDealerLocations();

  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/assign-tasks`;

  // --- Fetch Form Data (Salesmen, Dealers) and Tasks for the Table ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setErrorFetchingData(null);
    try {
      const response = await fetch(apiURI);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Validate fetched salesmen data
      const validatedSalesmen = z.array(salesmanSchema).safeParse(data.salesmen);
      if (validatedSalesmen.success) {
        setSalesmen(validatedSalesmen.data);
      } else {
        console.error("Salesmen data validation error:", validatedSalesmen.error);
        toast.error("Invalid salesmen data received from server.");
      }

      // Validate fetched dealers data
      const validatedDealers = z.array(dealerSchema).safeParse(data.dealers);
      if (validatedDealers.success) {
        setDealers(validatedDealers.data);
      } else {
        console.error("Dealers data validation error:", validatedDealers.error);
        toast.error("Invalid dealers data received from server.");
      }

      // Validate fetched tasks data
      const validatedTasks = z.array(dailyTaskSchema).safeParse(data.tasks);
      if (validatedTasks.success) {
        setTasks(validatedTasks.data);
      } else {
        console.error("Tasks data validation error:", validatedTasks.error);
        toast.error("Invalid tasks data received from server.");
      }

      toast.success("Form data and tasks loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch all data:", e);
      toast.error(e.message || "Failed to load form data or tasks.");
      setErrorFetchingData(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiURI]);

  useEffect(() => {
    fetchAllData(); // Fetch all data on component mount
  }, [fetchAllData]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]); // Clear previous errors
    setIsSubmitting(true);

    // UPDATED form data with new fields
    const formData = {
      salesmanUserIds: selectedSalesmen,
      taskDate: taskDate,
      visitType: visitType,
      relatedDealerIds: visitType === "Client Visit" ? selectedDealers : undefined,
      siteName: visitType === "Technical Visit" ? siteName : undefined,
      description: description || undefined,
      area: selectedArea || undefined,
      region: selectedRegion || undefined,
    };

    const validationResult = assignTaskFormSchema.safeParse(formData);

    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      toast.error("Please correct the form errors.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiURI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validationResult.data,
          taskDate: format(validationResult.data.taskDate, 'yyyy-MM-dd')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to assign tasks.");
      }

      toast.success("Tasks assigned successfully!");
      setIsFormOpen(false); // Close modal on success
      fetchAllData(); // Re-fetch all data to update the tasks table

      // Reset form state - UPDATED
      setSelectedSalesmen([]);
      setTaskDate(undefined);
      setVisitType("");
      setSelectedDealers([]);
      setSelectedArea("");
      setSelectedRegion("");
      setSiteName("");
      setDescription("");

    } catch (e: any) {
      console.error("Error assigning tasks:", e);
      toast.error(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to find and display form errors
  const findFormError = (path: string) => {
    return formErrors.find(error => error.path[0] === path)?.message;
  };

  // Columns for the Daily Tasks table
  const taskColumns: ColumnDef<DailyTaskRecord>[] = [
    { accessorKey: 'salesmanName', header: 'Salesman' },
    { accessorKey: 'assignedByUserName', header: 'Assigned By' },
    { accessorKey: 'taskDate', header: 'Task Date' },
    { accessorKey: 'visitType', header: 'Visit Type' },
    { accessorKey: 'relatedDealerName', header: 'Client Name', cell: info => info.getValue() || 'N/A' },
    { accessorKey: 'siteName', header: 'Site Name', cell: info => info.getValue() || 'N/A' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'createdAt', header: 'Assigned On', cell: info => new Date(info.getValue() as string).toLocaleDateString() },
  ];

  // Combine both loading states
  if (loading || locationsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading form data, tasks, and locations...
      </div>
    );
  }

  // Handle error from the new hook
  if (errorFetchingData || locationsError) {
    return (
      <div className="text-center text-red-500 min-h-screen pt-10">
        Error: {errorFetchingData || locationsError}
        <Button onClick={fetchAllData} className="ml-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Assign Daily Tasks</h1>
        <Button onClick={() => setIsFormOpen(true)}>+ Assign Tasks</Button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Use this page to assign daily client visits or technical visits to your salesmen.
      </p>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign New Daily Tasks</DialogTitle>
            <DialogDescription>
              Fill in the details to assign tasks to your salesmen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* Salesman Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salesmen" className="text-right">
                Salesmen <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <MultiSelect
                  options={salesmen.map(s => ({
                    label: `${s.firstName || s.email} ${s.lastName || ''} (${s.salesmanLoginId || 'N/A'})`.trim(),
                    value: s.id.toString(),
                  }))}
                  selectedValues={selectedSalesmen.map(id => id.toString())}
                  onValueChange={(values) => setSelectedSalesmen(values.map(Number))}
                  placeholder="Select salesmen"
                />
                {findFormError('salesmanUserIds') && (
                  <p className="text-red-500 text-sm mt-1">{findFormError('salesmanUserIds')}</p>
                )}
              </div>
            </div>

            {/* Area Selector - NEW */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right">
                Area
              </Label>
              <div className="col-span-3">
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.areas.map(area => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Region Selector - NEW */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="region" className="text-right">
                Region
              </Label>
              <div className="col-span-3">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskDate" className="text-right">
                Task Date <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!taskDate && "text-muted-foreground"
                        }`}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {taskDate ? format(taskDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={taskDate}
                      onSelect={setTaskDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {findFormError('taskDate') && (
                  <p className="text-red-500 text-sm mt-1">{findFormError('taskDate')}</p>
                )}
              </div>
            </div>

            {/* Visit Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Visit Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                onValueChange={(value: "Client Visit" | "Technical Visit") => {
                  setVisitType(value);
                  // Reset conditional fields when type changes
                  setSelectedDealers([]);
                  setSiteName("");
                }}
                value={visitType}
                className="col-span-3 flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Client Visit" id="client-visit" />
                  <Label htmlFor="client-visit">Client Visit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Technical Visit" id="technical-visit" />
                  <Label htmlFor="technical-visit">Technical Visit</Label>
                </div>
              </RadioGroup>
              {findFormError('visitType') && (
                <p className="text-red-500 text-sm mt-1 col-start-2 col-span-3">{findFormError('visitType')}</p>
              )}
            </div>

            {/* Conditional Fields based on Visit Type */}
            {visitType === "Client Visit" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clients" className="text-right">
                  Clients <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  {/* MultiSelect for dealers - UPDATED */}
                  <MultiSelect
                    options={dealers.map(dealer => ({
                      label: `${dealer.name} (${dealer.type})`,
                      value: dealer.id,
                    }))}
                    selectedValues={selectedDealers}
                    onValueChange={setSelectedDealers}
                    placeholder="Select clients"
                  />
                  {findFormError('relatedDealerIds') && (
                    <p className="text-red-500 text-sm mt-1">{findFormError('relatedDealerIds')}</p>
                  )}
                </div>
              </div>
            )}

            {visitType === "Technical Visit" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="siteName" className="text-right">
                  Site Name <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Input
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                  />
                  {findFormError('siteName') && (
                    <p className="text-red-500 text-sm mt-1">{findFormError('siteName')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional: Add a description for the task"
                  className="h-24"
                />
                {findFormError('description') && (
                  <p className="text-red-500 text-sm mt-1">{findFormError('description')}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Tasks"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assigned Tasks Table */}
      <h2 className="text-2xl font-bold mt-10 mb-4">Assigned Tasks</h2>
      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : errorFetchingData ? (
        <div className="text-center text-red-500 py-8">Error loading tasks: {errorFetchingData}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No tasks found for your company.</div>
      ) : (
        <div className="bg-card p-6 rounded-lg border border-border">
          <DataTableReusable
            columns={taskColumns}
            data={tasks}
            enableRowDragging={false}
            onRowOrderChange={() => { }}
          />
        </div>
      )}
    </div>
  );
}
