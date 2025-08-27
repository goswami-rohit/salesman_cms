// src/app/downloads/page.tsx
'use client';

import { useState } from 'react';
import { 
  Download, 
  Car,
  MapPin,
  PencilRuler,
  CalendarCheck,
  Building,
  Briefcase,
  BadgeIndianRupeeIcon,
  ChartNoAxesCombined,
  ListTodo,
  BandageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type ReportFormat = 'csv' | 'xlsx';

interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
  onDownload: (reportId: string, format: ReportFormat) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ id, title, description, icon: Icon, disabled, onDownload }) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('csv');
  
  const handleDownloadClick = () => {
    onDownload(id, selectedFormat);
  };

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4">
          <Select onValueChange={(value: ReportFormat) => setSelectedFormat(value)} defaultValue="csv">
            <SelectTrigger className="w-1/2 mr-2">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              {/*XLSX downloadable needs to be set later in lib/download-utils.ts and here */}
              {/*<SelectItem value="xlsx">XLSX</SelectItem>*/}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={handleDownloadClick}
            disabled={disabled}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


export default function DownloadsPage() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const reports = [
    {
      id: 'dailyVisitReports',
      title: 'Daily Visit Reports',
      description: 'Comprehensive data on daily sales visits, including check-in/out times and order details.',
      icon: Car,
    },
    {
      id: 'technicalVisitReports',
      title: 'Technical Visit Reports',
      description: 'Records of all technical visits, including site name, client remarks, and salesperson remarks.',
      icon: PencilRuler,
    },
    {
      id: 'pjp',
      title: 'Permanent Journey Plans',
      description: 'List of all permanent journey plans, including planned routes and descriptions.',
      icon: MapPin,
    },
    {
      id: 'dealers',
      title: 'Dealers Data',
      description: 'Full database of all dealers, including contact information and sales potential.',
      icon: Building,
    },
    {
      id: 'salesmanAttendance',
      title: 'Salesman Attendance',
      description: 'Detailed attendance records for all salesmen, with check-in/out times and locations.',
      icon: CalendarCheck,
    },
    {
      id: 'salesmanLeaveApplications',
      title: 'Leave Applications',
      description: 'Complete record of all leave applications submitted by salesmen.',
      icon: BandageIcon,
    },
    {
      id: 'clientReports',
      title: 'Client Reports',
      description: 'Salesperson-generated reports on client interactions and feedback.',
      icon: Briefcase,
    },
    {
      id: 'competitionReports',
      title: 'Competition Reports',
      description: 'Records of competitor activity, including products, pricing, and customer feedback.',
      icon: ChartNoAxesCombined,
    },
    {
      id: 'geoTracking',
      title: 'Geo-Tracking Records',
      description: 'Historical geo-location data for all salesmen, including new distance traveled.',
      icon: MapPin,
    },
    {
      id: 'dailyTasks',
      title: 'Daily Tasks',
      description: 'A list of daily tasks assigned to salesmen, including related dealer information.',
      icon: ListTodo,
    },
    {
      id: 'salesReport',
      title: 'Sales Report',
      description: 'A comrehensive report of sales in Metric Tonnes and Collection in Rs in regards to Daily Visit Reports of salesmen.',
      icon: BadgeIndianRupeeIcon,
    },
    {
      id: 'collectionReport',
      title: 'Collection Reports',
      description: 'A comrehensive report of only Collection in Rs in regards to Daily Visit Reports of salesmen.',
      icon: BadgeIndianRupeeIcon,
    },
    {
      id: 'ddpReport',
      title: 'DDP Report',
      description: 'A comrehensive report of Dealer Development Process.',
      icon: BadgeIndianRupeeIcon,
    },
    {
      id: 'dealerBrandCapacities',
      title: 'Dealer Brand Capacities-Mapping',
      description: 'A comrehensive report of how many MT of capacities each dealer has per brand of cement.',
      icon: BadgeIndianRupeeIcon,
    },
    {
      id: 'salesmanRating',
      title: 'Salesman Rating',
      description: 'A comrehensive report of ratings the salesmen recieve for their daily tasks, report submissions etc.',
      icon: BadgeIndianRupeeIcon,
    },
    {
      id: 'dealerReportsAndScores',
      title: 'Dealer Reports and Scores',
      description: 'A comrehensive report of scores of dealers/sub-delaers for their timely orders and payments etc.',
      icon: BadgeIndianRupeeIcon,
    },
   
  ];

  const handleDownload = async (reportId: string, format: ReportFormat) => {
    setDownloadingReport(reportId);
    try {
      const response = await fetch(`/api/downloads?reportType=${reportId}&format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to download file.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // In a real app, you would show a user-facing error message here.
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Downloads</h1>
          <p className="text-muted-foreground">Download comprehensive reports for various data tables.</p>
        </div>
      </div>
      <Separator className="my-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <ReportCard
            key={report.id}
            id={report.id}
            title={report.title}
            description={report.description}
            icon={report.icon}
            onDownload={handleDownload}
            disabled={downloadingReport === report.id}
          />
        ))}
      </div>
    </div>
  );
}
