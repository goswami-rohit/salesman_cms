// src/app/users/userManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, Mail } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// Define the valid regions and areas based on your company's data
const regions = ["Kamrup M", "Kamrup", "Karbi Anglong", "Dehmaji"];
const areas = ["Guwahati", "Tezpur", "Diphu", "Nagaon", "Barpeta"];


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

export default function UsersManagement({ adminUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'junior-executive',
    region: regions[0], // Initialize with a default value
    area: areas[0],     // Initialize with a default value
  });

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
      const response = await fetch('/api/users', {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${editingUser.id}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/${userId}`, {
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
      region: user.region || regions[0],
      area: user.area || areas[0],
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'junior-executive',
      region: regions[0],
      area: areas[0],
    });
    setEditingUser(null);
    setError('');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'president':
        return 'destructive'; // A prominent red for the highest-level role
      case 'senior-general-manager':
        return 'default';
      case 'general-manager':
        return 'secondary';
      case 'regional-sales-manager':
        return 'outline';
      case 'area-sales-manager':
        return 'destructive'; // Reusing 'destructive' for a key sales role
      case 'senior-manager':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'assistant-manager':
        return 'outline';
      case 'senior-executive':
        return 'default';
      case 'executive':
        return 'secondary';
      case 'junior-executive':
        return 'outline';
      default:
        return 'outline'; // A safe default for any unrecognized roles
    }
  };


  const isUserActive = (workosUserId: string | null) => {
    return workosUserId && !workosUserId.startsWith('pending_') && !workosUserId.startsWith('temp_');
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        </div>
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
                    placeholder="+1 (555) 123-4567"
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? 'Creating & Inviting...' : 'Create & Invite User'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.region || '-'}</TableCell>
                    <TableCell>{user.area || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isUserActive(user.workosUserId) ? (
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
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {/* Edit Dialog */}
                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
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

                              <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
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
                                  <Label htmlFor="edit-region">Region</Label>
                                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {regions.map(region => (
                                        <SelectItem key={region} value={region}>{region}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-area">Area</Label>
                                  <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {areas.map(area => (
                                        <SelectItem key={area} value={area}>{area}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
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

                        {/* Delete Dialog - Conditional Rendering */}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found. Create your first user!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
