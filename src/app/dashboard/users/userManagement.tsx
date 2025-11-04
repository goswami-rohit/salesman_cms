// src/app/users/userManagement.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUserLocations } from '@/components/reusable-user-locations';

// 1. Corrected Import: Using DataTableReusable as specified
import { DataTableReusable } from '@/components/data-table-reusable';
import { ColumnDef } from '@tanstack/react-table';
import { BulkInviteDialog } from './bulkInvite';

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  region: string | null; // Added new field
  area: string | null;   // Added new field
  workosUserId: string | null;
  createdAt: string;
  updatedAt: string;
  salesmanLoginId?: string | null;
}

interface Company {
  id: number;
  companyName: string;
}

interface AdminUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  company: Company;
  workosUserId: string | null;
}

interface Props {
  adminUser: AdminUser;
}

// Helper function moved outside component to avoid re-creation
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'president':
      return 'destructive';
    case 'senior-general-manager':
      return 'default';
    case 'general-manager':
      return 'secondary';
    case 'regional-sales-manager':
      return 'outline';
    case 'area-sales-manager':
      return 'destructive';
    case 'senior-manager':
      return 'default';
    case 'manager':
      return 'secondary';
    case 'assistant-manager':
      return 'outline';
    case 'senior-executive':
    case 'executive':
    case 'junior-executive':
      return 'outline';
    default:
      return 'outline';
  }
};

const isUserActive = (workosUserId: string | null) => {
  return workosUserId && !workosUserId.startsWith('pending_') && !workosUserId.startsWith('temp_');
};


export default function UsersManagement({ adminUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { locations, loading: locationsLoading, error: locationsError } = useUserLocations();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'junior-executive',
    region: '',
    area: '',
  });

  // New useEffect hook to set initial form data for user locations
  useEffect(() => {
    if (locations.regions.length > 0 && locations.areas.length > 0) {
      setFormData(prev => ({
        ...prev,
        region: prev.region || locations.regions[0],
        area: prev.area || locations.areas[0]
      }));
    }
  }, [locations]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const apiURI = `${process.env.NEXT_PUBLIC_APP_URL}/api/users`;
  const fetchUsers = async () => {
    try {
      const response = await fetch(apiURI);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // invitation for new users is set in /api/user
      const response = await fetch(apiURI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // formData now includes region and area
      });

      if (response.ok) {
        const data = await response.json();
        await fetchUsers();
        setShowCreateModal(false);
        resetForm();
        let successMsg = `User created and invitation sent to ${formData.email}.`;
        if (data.user && data.user.salesmanLoginId) {
          successMsg += ` Employee ID for mobile app: ${data.user.salesmanLoginId}. Password sent via email.`;
        }
        setSuccess(successMsg);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiURI}/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // formData now includes region and area
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        resetForm();
        setSuccess('User updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, workosUserId: string | null) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${apiURI}/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (workosUserId) {
          console.log(`Attempting to delete WorkOS user: ${workosUserId}`);
          const workosDeleteResponse = await fetch('/api/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workosUserId: workosUserId })
          });

          if (workosDeleteResponse.ok) {
            //console.log(`✅ WorkOS user ${workosUserId} deleted successfully.`);
            setSuccess('User deleted successfully.');
          } else {
            const errorData = await workosDeleteResponse.json();
            //console.error('❌ Failed to delete user from WorkOS:', errorData.error);
            setError(`User deletion done locally. Issue in deleting from Auth Side. Contact Authenticator: ${errorData.error}`);
          }
        } else {
          setSuccess('User deleted successfully.');
        }
        await fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user locally');
      }
    } catch (err) {
      setError('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      region: user.region || '',
      area: user.area || '',
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'junior-executive',
      region: '',
      area: '',
    });
    setEditingUser(null);
    setError('');
  };

  // Custom setter for success messages
  const handleSuccess = (message: string) => {
    setError('');
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Custom setter for error messages
  const handleError = (message: string) => {
    setSuccess('');
    setError(message);
    setTimeout(() => setError(''), 10000);
  };

  // 2. Define Columns for the DataTable
  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "User ID",
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.id}</span>
    },
    {
      accessorKey: "fullName",
      header: "Name",
      // Custom sorting function based on firstName and lastName
      sortingFn: (rowA, rowB, columnId) => {
        const nameA = `${rowA.original.firstName} ${rowA.original.lastName}`;
        const nameB = `${rowB.original.firstName} ${rowB.original.lastName}`;
        return nameA.localeCompare(nameB);
      },
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => row.original.phoneNumber || '-',
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={getRoleBadgeVariant(row.original.role)}>
          {row.original.role.replace(/-/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => row.original.region || '-',
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => row.original.area || '-',
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isActive = isUserActive(user.workosUserId);
        return (
          <div className="flex items-center space-x-2">
            {isActive ? (
              <>
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-green-600 text-sm">Active</span>
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600 text-sm">Pending</span>
              </>
            )}
          </div>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            {/* Edit Button - now just sets the user to be edited */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(user)}
            >
              <Edit className="w-4 h-4" />
            </Button>

            {/* Delete Dialog - Conditional Rendering (kept inline as it doesn't use parent state updates) */}
            {user.id !== adminUser.id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {user.firstName} {user.lastName}?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteUser(user.id, user.workosUserId)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
    // Removed formData from dependencies, as it's no longer used to render the dialog content here
  ], [editingUser, loading, locations.areas, locations.regions, adminUser.id]);


  if (loading || locationsLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading users and locations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (locationsError) {
    return (
      <div className="min-h-screen bg-background p-6 text-center text-red-500">
        <p>Error loading location data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage users for {adminUser.company.companyName}
            </p>
          </div>
          <div className="flex space-x-3">

            {/* --- ADD BULK USER INVITE BUTTON --- */}
            <BulkInviteDialog
              onSuccess={handleSuccess}
              onError={handleError}
              onRefreshUsers={fetchUsers}
            />
            {/* --- END ADD BULK USER --- */}

            {/* --- ADD SINGLE USER DIALOG --- */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User & Send Invitation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+91 9999900000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="president">President</SelectItem>
                        <SelectItem value="senior-general-manager">Senior General Manager</SelectItem>
                        <SelectItem value="general-manager">General Manager</SelectItem>
                        <SelectItem value="regional-sales-manager">Regional Sales Manager</SelectItem>
                        <SelectItem value="area-sales-manager">Area Sales Manager</SelectItem>
                        <SelectItem value="senior-manager">Senior Manager</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="assistant-manager">Assistant Manager</SelectItem>
                        <SelectItem value="senior-executive">Senior Executive</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="junior-executive">Junior Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.regions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area">Area</Label>
                      <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.areas.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="submit"
                      className="flex items-center"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                </form>
              </DialogContent>
            </Dialog>
            {/* --- END ADD USER DIALOG --- */}

            {/* --- EDIT DIALOG --- */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              {/* Note: No DialogTrigger needed here, the button in the table cell acts as the trigger via state change */}
              <DialogContent key={editingUser?.id}>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      required
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                    <Input
                      id="edit-phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Role section edit in Team Overview  */}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Region changed from Select to Input */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-region">Region</Label>
                      <Input
                        id="edit-region"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="North"
                      />
                    </div>

                    {/* Area changed from Select to Input */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-area">Area</Label>
                      <Input
                        id="edit-area"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        placeholder="Central"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Updating...' : 'Update User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {/* --- END EDIT DIALOG --- */}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-800 text-blue-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table (now using DataTableReusable component) */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 3. Using DataTableReusable component */}
            <DataTableReusable
              data={users}
              columns={columns}
            //filterColumn="email" // Allow filtering by email
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
