// src/app/dashboard/team-overview/teamTabContent.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTableReusable } from '@/components/data-table-reusable';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PencilIcon, EyeIcon, UsersIcon, Loader2 } from 'lucide-react';
import { MultiSelect } from '@/components/multi-select';

// Define the shape of a team member.
interface TeamMember {
  id: number;
  name: string;
  role: string;
  managedBy: string | null;
  manages: string;
  managedById: number | null;
  managesIds: number[];
  managesReports: { name: string; role: string; }[];
}

// Define the shape of a user for the dropdowns
// interface UserDropdown {
//   id: number;
//   name: string;
//   role: string;
// }

const allRoles = [
  'president',
  'senior-general-manager',
  'general-manager',
  'regional-sales-manager',
  'area-sales-manager',
  'senior-manager',
  'manager',
  'assistant-manager',
  'senior-executive',
  'executive',
  'junior-executive',
];

function EditRoleCell({ row, onSaveRole }: { row: any; onSaveRole: (userId: number, newRole: string) => void }) {
  const member = row.original;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newRole, setNewRole] = useState(member.role);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = true; // Replace with real logic

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveRole(member.id, newRole);
    setIsSaving(false);
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" disabled={!canEdit}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h4 className="font-bold mb-2">Edit Role</h4>
        <p className="text-sm text-gray-500">Member: {member.name}</p>
        <p className="text-sm text-gray-500 mb-4">Current Role: {member.role}</p>
        <div className="space-y-2">
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assign new role" />
            </SelectTrigger>
            <SelectContent>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsPopoverOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={newRole === member.role || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditMappingCell({ row, onSaveMapping, teamData }: { row: any; onSaveMapping: (userId: number, reportsToId: number | null, managesIds: number[]) => void; teamData: any[] }) {
  const member = row.original;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [newReportsToId, setNewReportsToId] = useState<number | null>(member.managedById);
  const [newManagesIds, setNewManagesIds] = useState<number[]>(member.managesIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const seniorMembers = teamData.filter(m => allRoles.indexOf(m.role) < allRoles.indexOf(member.role));
  const juniorMembers = teamData.filter(m => allRoles.indexOf(m.role) > allRoles.indexOf(member.role));
  const canEdit = true;

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveMapping(member.id, newReportsToId, newManagesIds ?? []);
    setIsSaving(false);
    setIsPopoverOpen(false);
  };

  const juniorDropdownOptions = juniorMembers.map(m => ({
    value: m.id.toString(),
    label: `${m.name} (${m.role})`,
  }));

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" disabled={!canEdit}>
          <UsersIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h4 className="font-bold mb-2">Edit Reporting Structure</h4>
        <p className="text-sm text-gray-500">Member: {member.name}</p>
        <p className="text-sm text-gray-500 mb-4">Current Role: {member.role}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Is Managed By</label>
            <Select
              value={newReportsToId?.toString() || 'none'}
              onValueChange={(value) => setNewReportsToId(value === 'none' ? null : Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Senior that manages this member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {seniorMembers.map(m => (
                  <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Manages</label>
          <MultiSelect
            options={juniorDropdownOptions}
            selectedValues={newManagesIds.map(id => id.toString())}
            onValueChange={(selectedValues) => setNewManagesIds(selectedValues.map(Number))}
            placeholder="Juniors that reports to this member.."
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsPopoverOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get roles a user can be assigned to.
// const getAssignableRoles = (currentRole: string) => {
//   const roleIndex = allRoles.indexOf(currentRole);
//   if (roleIndex === -1) return [];
//   // Admins can assign roles that are lower in the hierarchy.
//   return allRoles.slice(roleIndex + 1);
// };

// A function that returns the columns definition, allowing us to pass in state and handlers
const getTeamColumns = (
  teamData: TeamMember[],
  onSaveRole: (userId: number, newRole: string) => void,
  onSaveMapping: (userId: number, reportsToId: number | null, managesIds: number[]) => void
): ColumnDef<TeamMember>[] => {
  return [
    { accessorKey: 'name', header: 'Member Name' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'managedBy', header: 'Is Managed By' },
    {
      accessorKey: 'manages',
      header: 'Manages',
      cell: ({ row }) => {
        const managesReports = row.original.managesReports;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="icon" disabled={managesReports.length === 0}>
                <EyeIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <h4 className="font-bold mb-2">Total members: {managesReports.length}</h4>
              {managesReports.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {managesReports.map((report, index) => (
                    <li key={index}>{report.name} ({report.role})</li>
                  ))}
                </ul>
              ) : (
                <p>No direct reports.</p>
              )}
            </PopoverContent>
          </Popover>
        );
      },
    },
    {
      id: 'editRole',
      header: 'Edit Role',
      cell: ({ row }) => <EditRoleCell row={row} onSaveRole={onSaveRole} />
    },
    {
      id: 'editMapping',
      header: 'Edit Mapping',
      cell: ({ row }) => <EditMappingCell row={row} onSaveMapping={onSaveMapping} teamData={teamData} />
    },
  ];
};

export function TeamTabContent() {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const dataFetchURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/dataFetch`
  const editRoleURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editRole`
  const editMappingURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editMapping`

  const fetchTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(dataFetchURI, window.location.origin);
      if (selectedRole !== 'all') {
        url.searchParams.append('role', selectedRole);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team data');
      }
      const data: TeamMember[] = await response.json();
      setTeamData(data);
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleSaveRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(editRoleURI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
      toast.success('User role updated successfully!');
      // Re-fetch data to reflect the changes in the table
      fetchTeamData();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(error.message);
    }
  };

  const handleSaveMapping = async (userId: number, reportsToId: number | null) => {
    try {
      const response = await fetch(editMappingURI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reportsToId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reporting structure');
      }
      toast.success('Reporting structure updated successfully!');
      // Re-fetch data to reflect the changes
      fetchTeamData();
    } catch (error: any) {
      console.error('Failed to update reporting structure:', error);
      toast.error(error.message);
    }
  };

  const filteredData = useMemo(() => {
    return teamData.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [teamData, searchQuery]);

  const teamColumns = useMemo(() => getTeamColumns(teamData, handleSaveRole, handleSaveMapping), [teamData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Team Hierarchy</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <span className="text-gray-500">Loading team data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Team Hierarchy</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-center py-8 text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Hierarchy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-sm flex-grow"
          />
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filteredData.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            No team members found for this company with the selected filters.
          </div>
        ) : (
          <DataTableReusable columns={teamColumns} data={filteredData} />
        )}
      </CardContent>
    </Card>
  );
}
