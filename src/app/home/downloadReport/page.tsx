// src/app/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
//import Link from 'next/link';
import { 
  Download, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  BarChart3,
  TrendingUp,
  Building2,
  UserCheck,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Eye,
  //Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'users' | 'attendance' | 'analytics' | 'company';
  lastUpdated: Date;
  recordCount: number;
  status: 'available' | 'generating' | 'error';
  previewData?: any[];
  downloadUrl?: string;
}

interface DownloadProgress {
  reportId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
}

export default function DownloadReportsPage() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx'>('csv');
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [previewReport, setPreviewReport] = useState<ReportCard | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockReports: ReportCard[] = [
      {
        id: 'users-report',
        title: 'User Management Report',
        description: 'Complete list of all users with roles, status, and contact information',
        icon: Users,
        category: 'users',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        recordCount: 45,
        status: 'available',
      },
      {
        id: 'attendance-summary',
        title: 'Attendance Summary',
        description: 'Monthly attendance records, check-in/out times, and attendance rates',
        icon: Clock,
        category: 'attendance',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        recordCount: 1234,
        status: 'available',
      },
      {
        id: 'leave-requests',
        title: 'Leave Requests Report',
        description: 'All leave requests with approval status, dates, and reasons',
        icon: Calendar,
        category: 'attendance',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        recordCount: 89,
        status: 'available',
      },
      {
        id: 'company-analytics',
        title: 'Company Analytics Dashboard',
        description: 'Key performance metrics, growth trends, and business insights',
        icon: BarChart3,
        category: 'analytics',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        recordCount: 156,
        status: 'available',
      },
      {
        id: 'performance-metrics',
        title: 'Performance Metrics',
        description: 'Individual and team performance indicators and evaluations',
        icon: TrendingUp,
        category: 'analytics',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        recordCount: 78,
        status: 'generating',
      },
      {
        id: 'company-overview',
        title: 'Company Overview Report',
        description: 'General company information, departments, and organizational structure',
        icon: Building2,
        category: 'company',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        recordCount: 23,
        status: 'available',
      },
      {
        id: 'active-users',
        title: 'Active Users Report',
        description: 'Currently active users, login statistics, and session data',
        icon: UserCheck,
        category: 'users',
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        recordCount: 32,
        status: 'available',
      }
    ];

    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'users': return 'default';
      case 'attendance': return 'secondary';
      case 'analytics': return 'outline';
      case 'company': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'generating': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleDownload = async (report: ReportCard, format: 'csv' | 'xlsx') => {
    if (report.status !== 'available') return;

    // Add to download progress
    const progressItem: DownloadProgress = {
      reportId: report.id,
      progress: 0,
      status: 'downloading'
    };
    setDownloadProgress(prev => [...prev, progressItem]);

    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDownloadProgress(prev => 
        prev.map(item => 
          item.reportId === report.id 
            ? { ...item, progress: i }
            : item
        )
      );
    }

    // Complete download
    setDownloadProgress(prev => 
      prev.map(item => 
        item.reportId === report.id 
          ? { ...item, status: 'completed' }
          : item
      )
    );

    // Remove from progress after 3 seconds
    setTimeout(() => {
      setDownloadProgress(prev => 
        prev.filter(item => item.reportId !== report.id)
      );
    }, 3000);

    // Here you would implement actual download logic
    console.log(`Downloading ${report.title} as ${format.toUpperCase()}`);
  };

  const handlePreview = (report: ReportCard) => {
    // Mock preview data - replace with actual API call
    const mockPreviewData = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Sample Record ${i + 1}`,
      status: i % 2 === 0 ? 'Active' : 'Inactive',
      date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toLocaleDateString()
    }));
    
    setPreviewReport({ ...report, previewData: mockPreviewData });
  };

  const handleRefresh = async (reportId: string) => {
    setReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'generating' as const }
          : report
      )
    );

    // Simulate refresh
    setTimeout(() => {
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                status: 'available' as const, 
                lastUpdated: new Date(),
                recordCount: Math.floor(Math.random() * 1000) + 50
              }
            : report
        )
      );
    }, 2000);
  };

  const filteredReports = reports.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

  const getProgressForReport = (reportId: string) => {
    return downloadProgress.find(item => item.reportId === reportId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Download Reports</h1>
            <p className="text-muted-foreground mt-2">
              Export your company data in CSV or Excel format
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="users">User Management</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedFormat} onValueChange={(value: 'csv' | 'xlsx') => setSelectedFormat(value)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Downloads Alert */}
        {downloadProgress.length > 0 && (
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              {downloadProgress.length} download(s) in progress...
            </AlertDescription>
          </Alert>
        )}

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const IconComponent = report.icon;
            const progress = getProgressForReport(report.id);
            
            return (
              <Card key={report.id} className="hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">{report.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getCategoryBadgeVariant(report.category)} className="text-xs">
                            {report.category}
                          </Badge>
                          <span className={`text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status === 'generating' && <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />}
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {report.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{report.recordCount.toLocaleString()} records</span>
                    <span>Updated {formatTimeAgo(report.lastUpdated)}</span>
                  </div>
                  
                  <Separator />
                  
                  {/* Progress Bar */}
                  {progress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Downloading...</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handlePreview(report)}
                          disabled={report.status !== 'available'}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{previewReport?.title}</DialogTitle>
                          <DialogDescription>
                            Preview of the latest data (showing first 5 records)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          {previewReport?.previewData && (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="p-3 text-left">ID</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {previewReport.previewData.map((row: any, index: number) => (
                                    <tr key={index} className="border-t">
                                      <td className="p-3">{row.id}</td>
                                      <td className="p-3">{row.name}</td>
                                      <td className="p-3">
                                        <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                                          {row.status}
                                        </Badge>
                                      </td>
                                      <td className="p-3">{row.date}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(report, selectedFormat)}
                      disabled={report.status !== 'available' || !!progress}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {selectedFormat.toUpperCase()}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRefresh(report.id)}
                      disabled={report.status === 'generating'}
                    >
                      <RefreshCw className={`w-4 h-4 ${report.status === 'generating' ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}