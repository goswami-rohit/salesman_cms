// src/app/account/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Building2,
    Bell,
    Shield,
    Palette,
    Globe,
    Smartphone,
    Key,
    Download,
    Trash2,
    Eye,
    EyeOff,
    Camera,
    Save,
    RefreshCw,
    Mail,
    Phone,
    MapPin,
    Calendar,
   //Users,
    Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
    department: string;
    role: string;
    joinDate: string;
    avatar?: string;
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    weeklyReports: boolean;
    securityAlerts: boolean;
    teamUpdates: boolean;
    leaveApprovals: boolean;
    attendanceReminders: boolean;
}

interface SecuritySettings {
    twoFactorEnabled: boolean;
    sessionTimeout: string;
    passwordLastChanged: string;
    activeDevices: number;
}

interface PreferenceSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    dashboardLayout: 'default' | 'compact' | 'detailed';
}

function SafeDateDisplay({ date }: { date: string | Date }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <span>...</span>;
  }
  
  return <span>{new Date(date).toLocaleDateString()}</span>;
}

export default function AccountSettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // User profile state
    const [profile, setProfile] = useState<UserProfile>({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@company.com',
        phone: '+1 (555) 123-4567',
        bio: 'Senior Manager with 5+ years of experience in team leadership and project management.',
        location: 'New York, NY',
        department: 'Operations',
        role: 'Manager',
        joinDate: '2022-03-15',
    });

    // Notification settings state
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        weeklyReports: true,
        securityAlerts: true,
        teamUpdates: true,
        leaveApprovals: true,
        attendanceReminders: false,
    });

    // Security settings state
    const [security, setSecurity] = useState<SecuritySettings>({
        twoFactorEnabled: false,
        sessionTimeout: '24',
        passwordLastChanged: '2024-12-01',
        activeDevices: 3,
    });

    // Preference settings state
    const [preferences, setPreferences] = useState<PreferenceSettings>({
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        dashboardLayout: 'default',
    });

    const handleSaveProfile = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        }, 1000);
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess('Notification preferences updated!');
            setTimeout(() => setSuccess(''), 3000);
        }, 1000);
    };

    const handleSaveSecurity = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess('Security settings updated!');
            setTimeout(() => setSuccess(''), 3000);
        }, 1000);
    };

    const handleSavePreferences = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess('Preferences updated!');
            setTimeout(() => setSuccess(''), 3000);
        }, 1000);
    };

    const handlePasswordChange = () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters long!');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(''), 3000);
        }, 1000);
    };

    const handleExportData = () => {
        // Simulate data export
        const data = { profile, notifications, security, preferences };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'account-data.json';
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('Account data exported successfully!');
        setTimeout(() => setSuccess(''), 3000);
    };

    return (<>
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <SettingsIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                        <p className="text-muted-foreground">Manage your account preferences and security settings</p>
                    </div>
                </div>

                {/* Success Alert */}
                {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Settings Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">Notifications</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span className="hidden sm:inline">Security</span>
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            <span className="hidden sm:inline">Preferences</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal details and profile information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage src={profile.avatar} />
                                        <AvatarFallback className="text-lg">
                                            {profile.firstName[0]}{profile.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <h3 className="font-medium">Profile Photo</h3>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Camera className="w-4 h-4 mr-2" />
                                                Change Photo
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive">
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="flex">
                                            <Mail className="w-4 h-4 text-muted-foreground mt-3 mr-2" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="flex">
                                            <Phone className="w-4 h-4 text-muted-foreground mt-3 mr-2" />
                                            <Input
                                                id="phone"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <div className="flex">
                                            <MapPin className="w-4 h-4 text-muted-foreground mt-3 mr-2" />
                                            <Input
                                                id="location"
                                                value={profile.location}
                                                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <div className="flex">
                                            <Building2 className="w-4 h-4 text-muted-foreground mt-3 mr-2" />
                                            <Input
                                                id="department"
                                                value={profile.department}
                                                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Joined <SafeDateDisplay date={profile.joinDate} />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveProfile} disabled={loading}>
                                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notification Preferences
                                </CardTitle>
                                <CardDescription>
                                    Choose how you want to be notified about important updates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* General Notifications */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">General Notifications</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                                            </div>
                                            <Switch
                                                checked={notifications.emailNotifications}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Push Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                                            </div>
                                            <Switch
                                                checked={notifications.pushNotifications}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>SMS Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Receive text messages for urgent matters</p>
                                            </div>
                                            <Switch
                                                checked={notifications.smsNotifications}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Specific Notifications */}
                                <div className="space-y-4">
                                    <h3 className="font-medium">Specific Notifications</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Weekly Reports</Label>
                                                <p className="text-sm text-muted-foreground">Weekly summary of your activities</p>
                                            </div>
                                            <Switch
                                                checked={notifications.weeklyReports}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Security Alerts</Label>
                                                <p className="text-sm text-muted-foreground">Important security and login notifications</p>
                                            </div>
                                            <Switch
                                                checked={notifications.securityAlerts}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Team Updates</Label>
                                                <p className="text-sm text-muted-foreground">Updates from your team and colleagues</p>
                                            </div>
                                            <Switch
                                                checked={notifications.teamUpdates}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, teamUpdates: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Leave Approvals</Label>
                                                <p className="text-sm text-muted-foreground">Notifications for leave requests and approvals</p>
                                            </div>
                                            <Switch
                                                checked={notifications.leaveApprovals}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, leaveApprovals: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label>Attendance Reminders</Label>
                                                <p className="text-sm text-muted-foreground">Daily check-in and check-out reminders</p>
                                            </div>
                                            <Switch
                                                checked={notifications.attendanceReminders}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, attendanceReminders: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveNotifications} disabled={loading}>
                                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Preferences
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Password Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="w-5 h-5" />
                                        Password & Authentication
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    <Button onClick={handlePasswordChange} className="w-full">
                                        Update Password
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Last changed: {new Date(security.passwordLastChanged).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Two-Factor Authentication */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Two-Factor Authentication
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">2FA Status</p>
                                            <p className="text-sm text-muted-foreground">
                                                {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                        <Badge variant={security.twoFactorEnabled ? 'default' : 'secondary'}>
                                            {security.twoFactorEnabled ? 'ON' : 'OFF'}
                                        </Badge>
                                    </div>
                                    <Switch
                                        checked={security.twoFactorEnabled}
                                        onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enable two-factor authentication for enhanced security
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Session Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    Session Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Session Timeout</Label>
                                        <Select
                                            value={security.sessionTimeout}
                                            onValueChange={(value) => setSecurity({ ...security, sessionTimeout: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 hour</SelectItem>
                                                <SelectItem value="8">8 hours</SelectItem>
                                                <SelectItem value="24">24 hours</SelectItem>
                                                <SelectItem value="168">1 week</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Active Devices</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">{security.activeDevices} devices</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <Button variant="outline" className="w-full">
                                            Manage Devices
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSaveSecurity} disabled={loading}>
                                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Security Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Appearance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="w-5 h-5" />
                                        Appearance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Theme</Label>
                                        <Select
                                            value={preferences.theme}
                                            onValueChange={(value: 'light' | 'dark' | 'system') => setPreferences({ ...preferences, theme: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dashboard Layout</Label>
                                        <Select
                                            value={preferences.dashboardLayout}
                                            onValueChange={(value: 'default' | 'compact' | 'detailed') => setPreferences({ ...preferences, dashboardLayout: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Default</SelectItem>
                                                <SelectItem value="compact">Compact</SelectItem>
                                                <SelectItem value="detailed">Detailed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Localization */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        Localization
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Language</Label>
                                        <Select
                                            value={preferences.language}
                                            onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                                <SelectItem value="fr">French</SelectItem>
                                                <SelectItem value="de">German</SelectItem>
                                                <SelectItem value="zh">Chinese</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Timezone</Label>
                                        <Select
                                            value={preferences.timezone}
                                            onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                <SelectItem value="Europe/London">London</SelectItem>
                                                <SelectItem value="Europe/Paris">Paris</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date Format</Label>
                                        <Select
                                            value={preferences.dateFormat}
                                            onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select
                                            value={preferences.currency}
                                            onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                                                <SelectItem value="CAD">CAD (C$)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSavePreferences} disabled={loading}>
                                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Preferences
                            </Button>
                        </div>

                        {/* Danger Zone */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    These actions are permanent and cannot be undone
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border border-destructive/20 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-destructive">Export Account Data</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Download all your account data in JSON format
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={handleExportData}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Data
                                    </Button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border border-destructive/20 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-destructive">Deactivate Account</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Temporarily disable your account. You can reactivate it later.
                                        </p>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                                Deactivate
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Deactivate Account</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to deactivate your account? You won't be able to access your dashboard until you reactivate it.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline">Cancel</Button>
                                                <Button variant="destructive">
                                                    Deactivate Account
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border border-destructive/20 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-destructive">Delete Account</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Account
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your account
                                                    and remove all your data from our servers. All your chat history,
                                                    reports, and personal information will be lost forever.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    Yes, delete my account
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </>);
}