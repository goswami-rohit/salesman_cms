// src/app/dashboard/addDealers/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table'; // Import ColumnDef

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { MultiSelect } from '@/components/multi-select'; // Assuming you have a MultiSelect component
import { DataTableReusable } from '@/components/data-table-reusable'; // Import DataTableReusable

// --- Zod Schema for Form Validation (and GET response) ---
// This schema is now used for both form validation (after transform) and GET response validation
const dealerSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."),
    region: z.string().min(1, "Region is required."),
    area: z.string().min(1, "Area is required."),
    phoneNo: z.string().min(1, "Phone number is required.").max(20, "Phone number is too long."),
    address: z.string().min(1, "Address is required.").max(500, "Address is too long."),
    totalPotential: z.number().positive("Total potential must be a positive number."),
    bestPotential: z.number().positive("Best potential must be a positive number."),
    brandSelling: z.array(z.string()).min(1, "At least one brand must be selected."),
    feedbacks: z.string().min(1, "Feedbacks are required.").max(500, "Feedbacks are too long."),
    remarks: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// Schema for form submission, which transforms string inputs to numbers
const addDealerFormSchema = z.object({
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."),
    region: z.string().min(1, "Region is required."),
    area: z.string().min(1, "Area is required."),
    phoneNo: z.string().min(1, "Phone number is required.").max(20, "Phone number is too long."),
    address: z.string().min(1, "Address is required.").max(500, "Address is too long."),
    totalPotential: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val) && val > 0, {
        message: "Total potential must be a positive number.",
    }),
    bestPotential: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val) && val > 0, {
        message: "Best potential must be a positive number.",
    }),
    brandSelling: z.array(z.string()).min(1, "At least one brand must be selected."),
    feedbacks: z.string().min(1, "Feedbacks are required.").max(500, "Feedbacks are too long."),
    remarks: z.string().nullable().optional(),
});


type AddDealerFormData = z.infer<typeof addDealerFormSchema>; // This type reflects the *output* after transformation
type DealerRecord = z.infer<typeof dealerSchema>; // Type for records fetched from GET API

export default function AddDealersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);
    const [dealers, setDealers] = useState<DealerRecord[]>([]); // State for displaying dealers in table
    const [loadingDealers, setLoadingDealers] = useState(true);
    const [errorDealers, setErrorDealers] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<AddDealerFormData['type'] | ''>('');
    const [region, setRegion] = useState<AddDealerFormData['region'] | ''>('');
    const [area, setArea] = useState<AddDealerFormData['area'] | ''>('');
    const [phoneNo, setPhoneNo] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [totalPotential, setTotalPotential] = useState<string>(''); // State holds string
    const [bestPotential, setBestPotential] = useState<string>('');   // State holds string
    const [brandSelling, setBrandSelling] = useState<string[]>([]);
    const [feedbacks, setFeedbacks] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');

    // Dropdown Options (Hardcoded as per request)
    const dealerTypes = ["Dealer-Best", "Sub Dealer-Best", "Dealer-Non Best", "Sub Dealer-Non Best"];
    const regions = ["Kamrup M", "Kamrup", "Karbi Anglong", "Dehmaji"];
    const areas = ["Guwahati", "Tezpur", "Diphu", "Nagaon", "Barpeta"];
    const brands = ["Star", "Amrit", "Dalmia", "Topcem", "Black Tiger", "Surya Gold", "Max", "Taj", "Specify in remarks"];

    const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/add-dealers`;

    // --- Fetch Dealers for the Table ---
    const fetchDealers = useCallback(async () => {
        setLoadingDealers(true);
        setErrorDealers(null);
        try {
            const response = await fetch(apiURI);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: DealerRecord[] = await response.json();
            const validatedDealers = z.array(dealerSchema).parse(data); // Validate fetched data
            setDealers(validatedDealers);
            toast.success('Dealers loaded successfully!');
        } catch (e: any) {
            console.error("Failed to fetch dealers:", e);
            toast.error(e.message || "Failed to load dealers.");
            setErrorDealers(e.message);
        } finally {
            setLoadingDealers(false);
        }
    }, [apiURI]);

    useEffect(() => {
        fetchDealers(); // Fetch dealers on component mount
    }, [fetchDealers]);

    // --- Form Submission Handler ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors([]); // Clear previous errors
        setIsSubmitting(true);

        const formData = {
            name,
            type: type as AddDealerFormData['type'],
            region: region as AddDealerFormData['region'],
            area: area as AddDealerFormData['area'],
            phoneNo,
            address,
            totalPotential, // This is a string from state
            bestPotential,  // This is a string from state
            brandSelling,
            feedbacks,
            remarks: remarks || undefined,
        };

        const validationResult = addDealerFormSchema.safeParse(formData);

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
                body: JSON.stringify(validationResult.data), // validationResult.data will have numbers for potential fields
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || "Failed to add dealer.");
            }

            toast.success("Dealer added successfully!");
            setIsFormOpen(false); // Close modal on success
            fetchDealers(); // Re-fetch dealers to update the table

            // Reset form state
            setName('');
            setType('');
            setRegion('');
            setArea('');
            setPhoneNo('');
            setAddress('');
            setTotalPotential('');
            setBestPotential('');
            setBrandSelling([]);
            setFeedbacks('');
            setRemarks('');

        } catch (e: any) {
            console.error("Error adding dealer:", e);
            toast.error(e.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to find and display form errors
    const findFormError = (path: string) => {
        return formErrors.find(error => error.path[0] === path)?.message;
    };

    // Columns for the Dealers table
    const dealerColumns: ColumnDef<DealerRecord>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'region', header: 'Region' },
        { accessorKey: 'area', header: 'Area' },
        { accessorKey: 'phoneNo', header: 'Phone No.' },
        { accessorKey: 'totalPotential', header: 'Total Potential', cell: info => info.getValue() },
        { accessorKey: 'bestPotential', header: 'Best Potential', cell: info => info.getValue() },
        { accessorKey: 'brandSelling', header: 'Brands', cell: info => (info.getValue() as string[]).join(', ') },
        { accessorKey: 'createdAt', header: 'Added On', cell: info => new Date(info.getValue() as string).toLocaleDateString() },
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Manage Dealers</h1>
                <Button onClick={() => setIsFormOpen(true)}>+ Add New Dealer</Button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add new dealer or sub-dealer records to your system.
            </p>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Dealer</DialogTitle>
                        <DialogDescription>
                            Fill in the details to add a new dealer or sub-dealer.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        {/* Dealer Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Dealer Name <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter dealer name"
                                />
                                {findFormError('name') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('name')}</p>
                                )}
                            </div>
                        </div>

                        {/* Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Select value={type} onValueChange={(value: AddDealerFormData['type']) => setType(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select dealer type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealerTypes.map(dType => (
                                            <SelectItem key={dType} value={dType}>
                                                {dType}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {findFormError('type') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('type')}</p>
                                )}
                            </div>
                        </div>

                        {/* Region */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="region" className="text-right">
                                Region <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Select value={region} onValueChange={(value: AddDealerFormData['region']) => setRegion(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regions.map(reg => (
                                            <SelectItem key={reg} value={reg}>
                                                {reg}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {findFormError('region') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('region')}</p>
                                )}
                            </div>
                        </div>

                        {/* Area */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="area" className="text-right">
                                Area <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Select value={area} onValueChange={(value: AddDealerFormData['area']) => setArea(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areas.map(ar => (
                                            <SelectItem key={ar} value={ar}>
                                                {ar}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {findFormError('area') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('area')}</p>
                                )}
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phoneNo" className="text-right">
                                Phone No. <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="phoneNo"
                                    value={phoneNo}
                                    onChange={(e) => setPhoneNo(e.target.value)}
                                    placeholder="Enter phone number"
                                />
                                {findFormError('phoneNo') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('phoneNo')}</p>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                                Address <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter full address"
                                    className="h-24"
                                />
                                {findFormError('address') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('address')}</p>
                                )}
                            </div>
                        </div>

                        {/* Total Potential */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="totalPotential" className="text-right">
                                Total Potential <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="totalPotential"
                                    type="number"
                                    step="0.01"
                                    value={totalPotential}
                                    onChange={(e) => setTotalPotential(e.target.value)}
                                    placeholder="Enter total potential"
                                />
                                {findFormError('totalPotential') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('totalPotential')}</p>
                                )}
                            </div>
                        </div>

                        {/* Best Potential */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bestPotential" className="text-right">
                                Best Potential <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="bestPotential"
                                    type="number"
                                    step="0.01"
                                    value={bestPotential}
                                    onChange={(e) => setBestPotential(e.target.value)}
                                    placeholder="Enter best potential"
                                />
                                {findFormError('bestPotential') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('bestPotential')}</p>
                                )}
                            </div>
                        </div>

                        {/* Brand Selling */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brandSelling" className="text-right">
                                Brands Selling <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <MultiSelect
                                    options={brands.map(brand => ({ label: brand, value: brand }))}
                                    selectedValues={brandSelling}
                                    onValueChange={setBrandSelling}
                                    placeholder="Select brands"
                                />
                                {findFormError('brandSelling') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('brandSelling')}</p>
                                )}
                            </div>
                        </div>

                        {/* Feedbacks */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="feedbacks" className="text-right">
                                Feedbacks <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="feedbacks"
                                    value={feedbacks}
                                    onChange={(e) => setFeedbacks(e.target.value)}
                                    placeholder="Enter feedbacks"
                                    className="h-24"
                                />
                                {findFormError('feedbacks') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('feedbacks')}</p>
                                )}
                            </div>
                        </div>

                        {/* Remarks (Optional) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="remarks" className="text-right">
                                Remarks
                            </Label>
                            <div className="col-span-3">
                                <Textarea
                                    id="remarks"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Optional: Add any remarks"
                                    className="h-24"
                                />
                                {findFormError('remarks') && (
                                    <p className="text-red-500 text-sm mt-1">{findFormError('remarks')}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Dealer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dealers Table */}
            <h2 className="text-2xl font-bold mt-10 mb-4">Existing Dealers</h2>
            {loadingDealers ? (
                <div className="text-center py-8">Loading dealers...</div>
            ) : errorDealers ? (
                <div className="text-center text-red-500 py-8">Error loading dealers: {errorDealers}</div>
            ) : dealers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No dealers found for your company.</div>
            ) : (
                <div className="bg-card p-6 rounded-lg border border-border">
                    <DataTableReusable
                        columns={dealerColumns}
                        data={dealers}
                        enableRowDragging={false}
                        onRowOrderChange={() => { }}
                    />
                </div>
            )}
        </div>
    );
}
