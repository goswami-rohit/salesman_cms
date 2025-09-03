'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

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
import { MultiSelect } from '@/components/multi-select';
import { DataTableReusable } from '@/components/data-table-reusable';
// Define the valid regions and areas
import { areas, regions, dealerTypes, brands } from '@/lib/Reusable-constants'


// --- Zod Schema for GET response validation (DUPLICATED FOR CLIENT-SIDE) ---
// This schema is now defined directly in the client component to avoid server-side imports.
const dealerSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."),
    region: z.string().min(1, "Region is required."),
    area: z.string().min(1, "Area is required."),
    phoneNumber: z.string().min(1, "Phone number is required."),
    contactPerson: z.string().min(1, "Contact person is required."),
    contactPersonPhone: z.string().min(1, "Contact person phone is required."),
    fullAddress: z.string().min(1, "Full address is required."),
    brand: z.string().nullable().optional(),
    subBrand: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// --- Zod Schema for POST request validation (DUPLICATED FOR CLIENT-SIDE) ---
const addDealerSchema = z.object({
    name: z.string().min(1, "Dealer name is required."),
    type: z.string().min(1, "Dealer type is required."),
    region: z.string().min(1, "Region is required."),
    area: z.string().min(1, "Area is required."),
    phoneNumber: z.string().min(1, "Phone number is required."),
    contactPerson: z.string().min(1, "Contact person is required."),
    contactPersonPhone: z.string().min(1, "Contact person phone is required."),
    fullAddress: z.string().min(1, "Full address is required."),
    brand: z.string().optional().nullable(),
    subBrand: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
});

type Dealer = z.infer<typeof dealerSchema>;
type AddDealerFormState = z.infer<typeof addDealerSchema> & {
    formErrors?: {
        [key: string]: string;
    }
};

const emptyForm: AddDealerFormState = {
    name: "",
    type: "",
    region: "",
    area: "",
    phoneNumber: "",
    contactPerson: "",
    contactPersonPhone: "",
    fullAddress: "",
    brand: null,
    subBrand: null,
    description: null,
    formErrors: {},
};

 const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/add-dealers`;

export default function AddDealersPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<AddDealerFormState>(emptyForm);
    const [dealers, setDealers] = useState<Dealer[]>([]);
    const [loadingDealers, setLoadingDealers] = useState(true);
    const [errorDealers, setErrorDealers] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [dealerToDelete, setDealerToDelete] = useState<string | null>(null);

    // --- State for new filters ---
    const [areaFilter, setAreaFilter] = useState("all");
    const [regionFilter, setRegionFilter] = useState("all");

    const fetchData = useCallback(async () => {
        try {
            setLoadingDealers(true);
            const response = await fetch(apiURI);
            const data = await response.json();
            const validatedDealers = z.array(dealerSchema).parse(data);
            setDealers(validatedDealers);
            setErrorDealers(null);
        } catch (error) {
            console.error("Error fetching dealers:", error);
            setErrorDealers("Failed to fetch dealer data. Please try again.");
            setDealers([]);
        } finally {
            setLoadingDealers(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
    };

    const findFormError = (field: string) => {
        return form.formErrors?.[field];
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setForm(prev => ({ ...prev, formErrors: {} })); // Clear previous errors

        try {
            const validatedData = addDealerSchema.parse(form);

            const response = await fetch(apiURI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validatedData),
            });

            const result = await response.json();

            if (!response.ok) {
                // If the response is not ok, it's an API error
                if (result.errors) {
                    setForm(prev => ({ ...prev, formErrors: result.errors }));
                    toast.error("Please correct the form errors.");
                } else {
                    toast.error(result.error || "Failed to add dealer.");
                }
                return;
            }

            toast.success("Dealer added successfully!");
            setIsFormOpen(false);
            setForm(emptyForm);
            fetchData();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors = error.issues.reduce((acc, issue) => {
                    const key = issue.path[0];
                    if (typeof key === 'string') {
                        acc[key] = issue.message;
                    }
                    return acc;
                }, {} as Record<string, string>);
                setForm(prev => ({ ...prev, formErrors: newErrors }));
                toast.error("Validation failed. Please check your inputs.");
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!dealerToDelete) return;
        try {
            const response = await fetch(`${apiURI}/${dealerToDelete}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete dealer.");
            }
            toast.success("Dealer deleted successfully!");
            setIsDeleteDialogOpen(false);
            setDealerToDelete(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting dealer:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
        }
    };

    const dealerColumns: ColumnDef<Dealer>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "type",
            header: "Type",
        },
        {
            accessorKey: "region",
            header: "Region",
        },
        {
            accessorKey: "area",
            header: "Area",
        },
        {
            accessorKey: "contactPerson",
            header: "Contact Person",
        },
        {
            accessorKey: "contactPersonPhone",
            header: "Contact Phone",
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            setDealerToDelete(row.original.id);
                            setIsDeleteDialogOpen(true);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ], []);

    // Memoized filtered dealers list based on state
    const filteredDealers = useMemo(() => {
        return dealers.filter(dealer => {
            const areaMatches = areaFilter === "all" || dealer.area === areaFilter;
            const regionMatches = regionFilter === "all" || dealer.region === regionFilter;
            return areaMatches && regionMatches;
        });
    }, [dealers, areaFilter, regionFilter]);

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Manage Dealers</h1>
                <Button onClick={() => setIsFormOpen(true)}>
                    Add New Dealer
                </Button>
            </div>

            {/* Filter and column controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Area Filter */}
                <div className="flex-1">
                    <Select
                        onValueChange={(value) => setAreaFilter(value)}
                        value={areaFilter}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Area" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Areas</SelectItem>
                            {areas.map((area) => (
                                <SelectItem key={area} value={area}>
                                    {area}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Region Filter */}
                <div className="flex-1">
                    <Select
                        onValueChange={(value) => setRegionFilter(value)}
                        value={regionFilter}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Region" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            {regions.map((region) => (
                                <SelectItem key={region} value={region}>
                                    {region}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Add New Dealer</DialogTitle>
                        <DialogDescription>
                            Fill in the details to add a new dealer record.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={handleFormChange}
                                className="col-span-3"
                            />
                            {findFormError('name') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('name')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setForm(prev => ({ ...prev, type: value }))}
                                value={form.type || ''}
                            >
                                <SelectTrigger id="type" className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dealerTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {findFormError('type') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('type')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="region" className="text-right">
                                Region <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setForm(prev => ({ ...prev, region: value }))}
                                value={form.region || ''}
                            >
                                <SelectTrigger id="region" className="col-span-3">
                                    <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                    {regions.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {findFormError('region') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('region')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="area" className="text-right">
                                Area <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                onValueChange={(value) => setForm(prev => ({ ...prev, area: value }))}
                                value={form.area || ''}
                            >
                                <SelectTrigger id="area" className="col-span-3">
                                    <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((area) => (
                                        <SelectItem key={area} value={area}>
                                            {area}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {findFormError('area') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('area')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phoneNumber" className="text-right">
                                Phone <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleFormChange}
                                className="col-span-3"
                                type="tel"
                            />
                            {findFormError('phoneNumber') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('phoneNumber')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactPerson" className="text-right">
                                Contact Person <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="contactPerson"
                                value={form.contactPerson}
                                onChange={handleFormChange}
                                className="col-span-3"
                            />
                            {findFormError('contactPerson') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('contactPerson')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactPersonPhone" className="text-right">
                                Contact Phone <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="contactPersonPhone"
                                value={form.contactPersonPhone}
                                onChange={handleFormChange}
                                className="col-span-3"
                                type="tel"
                            />
                            {findFormError('contactPersonPhone') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('contactPersonPhone')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullAddress" className="text-right">
                                Address <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="fullAddress"
                                value={form.fullAddress}
                                onChange={handleFormChange}
                                className="col-span-3"
                            />
                            {findFormError('fullAddress') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('fullAddress')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brand" className="text-right">
                                Brand
                            </Label>
                            <Select
                                onValueChange={(value) => setForm(prev => ({ ...prev, brand: value }))}
                                value={form.brand || ''}
                            >
                                <SelectTrigger id="brand" className="col-span-3">
                                    <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand} value={brand}>
                                            {brand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {findFormError('brand') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('brand')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subBrand" className="text-right">
                                Sub-Brand
                            </Label>
                            <Input
                                id="subBrand"
                                value={form.subBrand || ''}
                                onChange={handleFormChange}
                                className="col-span-3"
                            />
                            {findFormError('subBrand') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('subBrand')}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={form.description || ''}
                                onChange={handleFormChange}
                                placeholder="Optional description..."
                                className="col-span-3"
                            />
                            {findFormError('description') && (
                                <p className="text-red-500 text-sm col-span-4 text-right">{findFormError('description')}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Dealer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the dealer record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
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
                        data={filteredDealers}
                        enableRowDragging={false}
                        onRowOrderChange={() => { }}
                    />
                </div>
            )}
        </div>
    );
}
