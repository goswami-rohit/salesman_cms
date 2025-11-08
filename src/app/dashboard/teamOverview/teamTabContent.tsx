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
import { PencilIcon, EyeIcon, UsersIcon, Loader2, StoreIcon } from 'lucide-react';
import { MultiSelect } from '@/components/multi-select';
import { ROLE_HIERARCHY, canAssignRole } from '@/lib/roleHierarchy';
import { useDealerLocations } from '@/components/reusable-dealer-locations';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  managedBy: string | null;
  manages: string;
  managedById: number | null;
  managesIds: number[];
  managesReports: { name: string; role: string }[];
  area?: string | null;
  region?: string | null;
}

const allRoles = ROLE_HIERARCHY;

/** Returns roles currentUser can assign */
const getAssignableRoles = (currentRole?: string | null) => {
  if (!currentRole) return [];
  return allRoles.filter((r) => canAssignRole(currentRole, r));
};

function EditRoleCell({
  row,
  onSaveRole,
  currentUserRole,
}: {
  row: any;
  onSaveRole: (userId: number, newRole: string) => void;
  currentUserRole: string | null;
}) {
  const member: TeamMember = row.original;
  const [isOpen, setIsOpen] = useState(false);
  const [newRole, setNewRole] = useState(member.role);
  const [isSaving, setIsSaving] = useState(false);

  // Roles current user can assign
  const assignableRoles = useMemo(() => getAssignableRoles(currentUserRole), [currentUserRole]);

  // Roles to show in select: always include current role for valid select value
  const rolesToShow = useMemo(() => {
    const set = new Set<string>();
    // current role must appear so the select shows a valid value
    if (member.role) set.add(member.role);
    for (const r of assignableRoles) set.add(r);
    return Array.from(set);
  }, [assignableRoles, member.role]);

  const canEdit = (currentUserRole !== null) && assignableRoles.length > 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveRole(member.id, newRole);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          size="icon" 
          disabled={!canEdit}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 border border-border/30 bg-popover/50 backdrop-blur-lg">
        <h4 className="font-bold mb-2">Edit Role</h4>
        <p className="text-sm text-gray-500">Member: {member.name}</p>
        <p className="text-sm text-gray-500 mb-4">Current Role: {member.role}</p>

        <div className="space-y-2">
          <Select value={newRole} onValueChange={(v) => setNewRole(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assign new role" />
            </SelectTrigger>
            <SelectContent className="border border-border/30 bg-popover/50 backdrop-blur-lg">
              {rolesToShow.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={newRole === member.role || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditMappingCell({
  row,
  onSaveMapping,
  teamData,
  currentUserRole,
}: {
  row: any;
  onSaveMapping: (userId: number, reportsToId: number | null, managesIds: number[]) => void;
  teamData: TeamMember[];
  currentUserRole: string | null;
}) {
  const member: TeamMember = row.original;
  const [isOpen, setIsOpen] = useState(false);
  const [newReportsToId, setNewReportsToId] = useState<number | null>(member.managedById);
  const [newManagesIds, setNewManagesIds] = useState<number[]>(member.managesIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const memberIndex = allRoles.indexOf(member.role);

  // manager options = people who are higher (index < memberIndex) AND current user may assign that manager role
  const managerOptions = useMemo(() => {
    if (!currentUserRole) return [];
    if (memberIndex === -1) return [];
    return teamData
      .filter((m) => m.id !== member.id)
      .filter((m) => {
        const idx = allRoles.indexOf(m.role);
        return idx !== -1 && idx < memberIndex && canAssignRole(currentUserRole, m.role);
      })
      .map((m) => ({ id: m.id, value: m.id.toString(), label: `${m.name} (${m.role})` }));
  }, [teamData, memberIndex, member.id, member.role, currentUserRole]);

  // junior options = people who are lower (index > memberIndex) AND current user may assign that junior role
  const juniorOptions = useMemo(() => {
    if (!currentUserRole) return [];
    if (memberIndex === -1) return [];
    return teamData
      .filter((m) => m.id !== member.id)
      .filter((m) => {
        const idx = allRoles.indexOf(m.role);
        return idx !== -1 && idx > memberIndex && canAssignRole(currentUserRole, m.role);
      })
      .map((m) => ({ id: m.id, value: m.id.toString(), label: `${m.name} (${m.role})` }));
  }, [teamData, memberIndex, member.id, member.role, currentUserRole]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveMapping(member.id, newReportsToId, newManagesIds ?? []);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          size="icon" 
          disabled={!currentUserRole}>
          <UsersIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 border border-border/30 bg-popover/50 backdrop-blur-lg">
        <h4 className="font-bold mb-2">Edit Reporting Structure</h4>
        <p className="text-sm text-gray-500">Member: {member.name}</p>
        <p className="text-sm text-gray-500 mb-4">Current Role: {member.role}</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Is Managed By</label>
            <Select
              value={newReportsToId?.toString() ?? 'none'}
              onValueChange={(value) => setNewReportsToId(value === 'none' ? null : Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Senior that manages this member" />
              </SelectTrigger>
              <SelectContent className="border border-border/30 bg-popover/50 backdrop-blur-lg">
                <SelectItem value="none">None</SelectItem>
                {managerOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Manages</label>
            <MultiSelect
              options={juniorOptions.map((o) => ({ value: o.value, label: o.label }))}
              selectedValues={newManagesIds.map((id) => id.toString())}
              onValueChange={(selectedValues) => setNewManagesIds(selectedValues.map(Number))}
              placeholder="Juniors that report to this member.."
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditDealerMappingCell({
  row,
  onSaveDealerMapping,
  currentUserRole,
}: {
  row: any;
  onSaveDealerMapping: (userId: number, dealerIds: string[]) => void;
  currentUserRole: string | null;
}) {
  const member: TeamMember = row.original;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDealerIds, setSelectedDealerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dealerOptions, setDealerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');

  const { locations, loading: locationsLoading } = useDealerLocations();
  // New state for area and region filters
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const ALL = "all";

  // Fetch dealers for this user when popover opens
  useEffect(() => {
    if (!isOpen) {
      // Reset filters when the popover closes
      setSelectedArea(null);
      setSelectedRegion(null);
      setDealerSearchQuery(''); // Clear search on close
      return;
    }
    // Only fetch if locations are not loading
    if (locationsLoading) {
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        // Construct the URL with area and region query parameters
        const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editDealerMapping`);
        url.searchParams.append('userId', String(member.id));
        // Use selected filters instead of member's area/region
        if (selectedArea) {
          url.searchParams.append('area', selectedArea);
        }
        if (selectedRegion) {
          url.searchParams.append('region', selectedRegion);
        }

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setDealerOptions(data.dealers.map((d: any) => ({ value: d.id, label: d.name })));
          setSelectedDealerIds(data.assignedDealerIds ?? []);
        } else {
          console.error("Failed to fetch dealers", res.status);
          toast.error("Failed to load dealers. Please try again.");
        }
      } catch (e) {
        console.error("Failed to fetch dealers", e);
        toast.error("An error occurred while loading dealers.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, member.id, selectedArea, selectedRegion, locationsLoading]);

  // Filter dealer options based on search query
  const filteredDealerOptions = useMemo(() => {
    if (!dealerSearchQuery) {
      return dealerOptions;
    }
    const query = dealerSearchQuery.toLowerCase();
    return dealerOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [dealerOptions, dealerSearchQuery]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDealerMapping(member.id, selectedDealerIds);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedArea(null);
    setSelectedRegion(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          size="icon" 
          disabled={!currentUserRole}>
          <StoreIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 border border-border/30 bg-popover/50 backdrop-blur-lg">
        <h4 className="font-bold mb-2">Edit Dealer Mapping</h4>
        <p className="text-sm text-gray-500 mb-4">Salesman: {member.name}</p>

        {/* Dropdown selectors for Area and Region */}
        <div className="flex gap-2 mb-4">
          {/* Area */}
          <Select
            value={selectedArea ?? ALL}
            onValueChange={(val) => setSelectedArea(val === ALL ? null : val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Area" />
            </SelectTrigger>
            <SelectContent className="border border-border/30 bg-popover/50 backdrop-blur-lg">
              <SelectItem value={ALL}>All Areas</SelectItem>
              {locations.areas.sort().map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region */}
          <Select
            value={selectedRegion ?? ALL}
            onValueChange={(val) => setSelectedRegion(val === ALL ? null : val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent className="border border-border/30 bg-popover/50 backdrop-blur-lg">
              <SelectItem value={ALL}>All Regions</SelectItem>
              {locations.regions.sort().map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handleClearFilters} disabled={!selectedArea && !selectedRegion}>
            Clear Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading dealers...</div>
        ) : (
          <MultiSelect
            options={filteredDealerOptions}
            selectedValues={selectedDealerIds}
            onValueChange={setSelectedDealerIds}
            placeholder="Assign dealers to salesmen.."
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getTeamColumns = (
  teamData: TeamMember[],
  onSaveRole: (userId: number, newRole: string) => void,
  onSaveMapping: (userId: number, reportsToId: number | null, managesIds: number[]) => void,
  onSaveDealerMapping: (userId: number, dealerIds: string[]) => void,
  currentUserRole: string | null
): ColumnDef<TeamMember>[] => {
  return [
    { accessorKey: 'name', header: 'Member Name' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'managedBy', header: 'Is Managed By' },
    {
      accessorKey: 'manages',
      header: 'Manages',
      cell: ({ row }) => {
        const managesReports = row.original.managesReports as TeamMember['managesReports'];
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              size="icon" 
              disabled={managesReports.length === 0}>
                <EyeIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 border border-border/30 bg-popover/50 backdrop-blur-lg">
              <h4 className="font-bold mb-2">Total members: {managesReports.length}</h4>
              {managesReports.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {managesReports.map((report, idx) => (
                    <li key={idx}>
                      {report.name} ({report.role})
                    </li>
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
      cell: ({ row }) => <EditRoleCell row={row} currentUserRole={currentUserRole} onSaveRole={onSaveRole} />,
    },
    {
      id: 'editMapping',
      header: 'Edit Mapping',
      cell: ({ row }) => (
        <EditMappingCell row={row} currentUserRole={currentUserRole} onSaveMapping={onSaveMapping} teamData={teamData} />
      ),
    },
    {
      id: 'editDealerMapping',
      header: 'Edit Dealer Mapping',
      cell: ({ row }) => (
        <EditDealerMappingCell row={row} currentUserRole={currentUserRole} onSaveDealerMapping={onSaveDealerMapping} />
      ),
    },
  ];
};

export function TeamTabContent() {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const dataFetchURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/dataFetch`;
  const editRoleURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editRole`;
  const editMappingURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editMapping`;
  const editDealerMappingURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboardPagesAPI/team-overview/editDealerMapping`;
  const currentUserURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/me`;

  const loadTeamData = useCallback(
    async (roleOverride?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const roleToUse = roleOverride ?? selectedRole;
        const url = new URL(dataFetchURI, window.location.origin);
        if (roleToUse && roleToUse !== 'all') url.searchParams.append('role', roleToUse);

        const response = await fetch(url.toString());
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team data');
        }
        const data: TeamMember[] = await response.json();
        setTeamData(data);
      } catch (err: any) {
        console.error('Error fetching team data:', err);
        toast.error(err.message || 'Error fetching team data');
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    },
    [dataFetchURI, selectedRole]
  );

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(currentUserURI);
      if (res.ok) {
        const user = await res.json();
        setCurrentUserRole(user.role ?? null);
      } else {
        setCurrentUserRole(null);
      }
    } catch (e) {
      console.error('Failed to fetch current user role', e);
      setCurrentUserRole(null);
    }
  }, [currentUserURI]);

  useEffect(() => {
    (async () => {
      await fetchCurrentUser();
      await loadTeamData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = useCallback(
    async (value: string) => {
      setSelectedRole(value);
      await loadTeamData(value);
    },
    [loadTeamData]
  );

  const handleSaveRole = useCallback(
    async (userId: number, newRole: string) => {
      try {
        const response = await fetch(editRoleURI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newRole }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update role');
        }
        toast.success('User role updated successfully!');
        await loadTeamData();
      } catch (err: any) {
        console.error('Failed to update role:', err);
        toast.error(err.message || 'Failed to update role');
      }
    },
    [editRoleURI, loadTeamData]
  );

  const handleSaveMapping = useCallback(
    async (userId: number, reportsToId: number | null, managesIds: number[] = []) => {
      try {
        const response = await fetch(editMappingURI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, reportsToId, managesIds }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update reporting structure');
        }
        toast.success('Reporting structure updated successfully!');
        await loadTeamData();
      } catch (err: any) {
        console.error('Failed to update reporting structure:', err);
        toast.error(err.message || 'Failed to update reporting structure');
      }
    },
    [editMappingURI, loadTeamData]
  );

  const handleSaveDealerMapping = useCallback(
    async (userId: number, dealerIds: string[]) => {
      try {
        const response = await fetch(editDealerMappingURI, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, dealerIds }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update dealer mapping');
        }
        toast.success('Dealer mapping updated successfully!');
        await loadTeamData();
      } catch (err: any) {
        console.error('Failed to update dealer mapping:', err);
        toast.error(err.message || 'Failed to update dealer mapping');
      }
    },
    [editDealerMappingURI, loadTeamData]
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamData.filter((member) => {
      if (!q) return true;
      return member.name.toLowerCase().includes(q) || member.role.toLowerCase().includes(q);
    });
  }, [teamData, searchQuery]);

  const teamColumns = useMemo(
    () => getTeamColumns(teamData, handleSaveRole, handleSaveMapping, handleSaveDealerMapping, currentUserRole),
    [teamData, handleSaveRole, handleSaveMapping, handleSaveDealerMapping, currentUserRole]
  );

  if (isLoading) {
    return (
      <Card className="border border-border/30 bg-card/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Team Hierarchy</CardTitle>
        </CardHeader>
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
      <Card className="border border-border/30 bg-card/50 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Team Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8 text-red-500">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/30 bg-card/50 backdrop-blur-lg">
      <CardHeader>
        <CardTitle>Team Hierarchy & Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:max-w-sm grow"
          />
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="border border-border/30 bg-popover/50 backdrop-blur-lg">
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
          <div className="text-center text-neutral-500 py-8">No team members found for this company with the selected filters.</div>
        ) : (
          <DataTableReusable 
            columns={teamColumns} 
            data={filteredData} />
        )}
      </CardContent>
    </Card>
  );
}
