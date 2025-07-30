// src/app/dashboard/assignTasks/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
//import { getTokenClaims } from '@workos-inc/authkit-nextjs';
//import { redirect } from 'next/navigation';
import { z } from "zod";
import { toast } from "sonner";

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
import { MultiSelect } from "@/components/multi-select"; // Assuming you have a MultiSelect component
import { Calendar } from "@/components/ui/calendar"; // Assuming you have a Calendar component
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { IconCalendar } from "@tabler/icons-react";


// --- Zod Schemas for Data and Form Validation ---

// Schema for fetching salesmen and dealers
const salesmanSchema = z.object({
  id: z.number().int(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email(),
  salesmanLoginId: z.string().nullable(),
});

const dealerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["Dealer", "Sub Dealer"]),
});

type Salesman = z.infer<typeof salesmanSchema>;
type Dealer = z.infer<typeof dealerSchema>;

// Schema for form submission validation
const assignTaskFormSchema = z.object({
  salesmanUserIds: z.array(z.number().int()).min(1, "Please select at least one salesman."),
  taskDate: z.date({
    error: "A task date is required.",
  }),
  visitType: z.enum(["Client Visit", "Technical Visit"], {
    error: "Please select a visit type.",
  }),
  relatedDealerId: z.string().uuid().optional(), // Required only for Client Visit
  siteName: z.string().min(1, "Site name is required for Technical Visit.").optional(), // Required only for Technical Visit
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  // Conditional validation based on visitType
  if (data.visitType === "Client Visit") {
    if (!data.relatedDealerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Client name is required for Client Visit.",
        path: ['relatedDealerId'],
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
    if (data.relatedDealerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Client name should not be provided for Technical Visit.",
        path: ['relatedDealerId'],
      });
    }
  }
});

//type AssignTaskFormData = z.infer<typeof assignTaskFormSchema>;

export default function AssignTasksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  // Form State
  const [selectedSalesmen, setSelectedSalesmen] = useState<number[]>([]);
  const [taskDate, setTaskDate] = useState<Date | undefined>(undefined);
  const [visitType, setVisitType] = useState<"Client Visit" | "Technical Visit" | "">("");
  const [selectedDealerId, setSelectedDealerId] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // --- Authentication Check ---
  // useEffect(() => {
  //   async function checkAuth() {
  //     const claims = await getTokenClaims();
  //     if (!claims || !claims.sub) {
  //       redirect('/login'); 
  //     }    
  //     if (!claims.org_id) {
  //       redirect('/dashboard'); 
  //     }
    
  //   }
  //   checkAuth();
  // }, []);

  // --- Fetch Salesmen and Dealers for the Form ---
  const fetchFormData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboardPagesAPI/assign-tasks");
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

      toast.success("Form data loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch form data:", e);
      toast.error(e.message || "Failed to load form data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]); // Clear previous errors
    setIsSubmitting(true);

    const formData = {
      salesmanUserIds: selectedSalesmen,
      taskDate: taskDate, // Zod will expect a Date object
      visitType: visitType,
      relatedDealerId: visitType === "Client Visit" ? selectedDealerId : undefined,
      siteName: visitType === "Technical Visit" ? siteName : undefined,
      description: description || undefined, // Send as undefined if empty string
    };

    const validationResult = assignTaskFormSchema.safeParse(formData);

    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      toast.error("Please correct the form errors.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/dashboardPagesAPI/assign-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validationResult.data,
          taskDate: format(validationResult.data.taskDate, 'yyyy-MM-dd') // Format date for API
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to assign tasks.");
      }

      toast.success("Tasks assigned successfully!");
      setIsFormOpen(false); // Close modal on success
      // Reset form state
      setSelectedSalesmen([]);
      setTaskDate(undefined);
      setVisitType("");
      setSelectedDealerId("");
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading form data...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Assign Daily Tasks</h1>
        <Button onClick={() => setIsFormOpen(true)}>+ Assign Tasks</Button>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
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
                {/* MultiSelect component - you'll need to ensure this component is available */}
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
                      className={`w-full justify-start text-left font-normal ${
                        !taskDate && "text-muted-foreground"
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
                  setSelectedDealerId("");
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
                <Label htmlFor="clientName" className="text-right">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealers.map(dealer => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name} ({dealer.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {findFormError('relatedDealerId') && (
                    <p className="text-red-500 text-sm mt-1">{findFormError('relatedDealerId')}</p>
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
    </div>
  );
}