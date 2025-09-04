// src/app/home/downloadReport/masterCustomDownload.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Download, PlusCircle, CheckIcon, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the available tables and their columns.
// This data structure must be kept in sync with the `modelMap` in the backend.
const tables = [
  {
    id: 'dailyVisitReports',
    title: 'Daily Visit Reports',
    columns: ['reportDate', 'dealerType', 'dealerName', 'subDealerName', 'location', 'visitType', 'todayOrderMt', 'todayCollectionRupees', 'feedbacks', 'salesmanName'],
  },
  {
    id: 'technicalVisitReports',
    title: 'Technical Visit Reports',
    columns: ["id", "reportDate", "visitType", "siteNameConcernedPerson", "phoneNo", "emailId", "clientsRemarks", "salespersonRemarks", "checkInTime", "checkOutTime", "inTimeImageUrl", "outTimeImageUrl", "siteVisitBrandInUse", "siteVisitStage", "conversionFromBrand", "conversionQuantityValue", "conversionQuantityUnit", "associatedPartyName", "influencerType", "serviceType", "qualityComplaint", "promotionalActivity", "channelPartnerVisit", "createdAt", "updatedAt", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'salesmanAttendance',
    title: 'Salesman Attendance',
    columns: ["salesmanName", "salesmanEmail", "attendanceDate", "locationName", "inTimeTimestamp", "outTimeTimestamp", "inTimeImageCaptured", "outTimeImageCaptured", "inTimeImageUrl", "outTimeImageUrl", "inTimeLatitude", "inTimeLongitude", "inTimeAccuracy", "inTimeSpeed", "inTimeHeading", "inTimeAltitude", "outTimeLatitude", "outTimeLongitude", "outTimeAccuracy", "outTimeSpeed", "outTimeHeading", "outTimeAltitude", "createdAt", "updatedAt"],
  },
  {
    id: 'permanentJourneyPlans',
    title: 'Permanent Journey Plans (PJP)',
    columns: ["id", "planDate", "areaToBeVisited", "description", "status", "createdAt", "updatedAt",
      "assignedToName", "assignedToEmail", "creatorName", "creatorEmail"],
  },
  {
    id: 'dealers',
    title: 'Dealers',
    columns: ["id", "name", "region", "area", "address", "phoneNo", "pinCode", "dateOfBirth", "anniversaryDate",
      "totalPotential", "bestPotential", "brandSelling", "feedbacks", "remarks",
      "salesmanName", "createdAt", "updatedAt"],
  },
  {
    id: 'salesmanLeaveApplications',
    title: 'Salesman Leave Applications',
    columns: ["id", "leaveType", "startDate", "endDate", "reason", "status", "createdAt", "updatedAt",
      "salesmanName", "salesmanEmail"],
  },
  {
    id: 'clientReports',
    title: 'Client Reports',
    columns: ["id", "title", "reportDate", "clientName", "clientType",
      "clientLocation", "details", "createdAt", "updatedAt", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'competitionReports',
    title: 'Competition Reports',
    columns: ["id", "competitorName", "productDetails", "pricing", "reportDate", "remarks",
      "createdAt", "updatedAt", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'geoTracking',
    title: 'Geo Tracking',
    columns: ["id", "latitude", "longitude", "recordedAt", "accuracy", "speed", "heading", "altitude",
      "locationType", "activityType", "appState", "batteryLevel", "isCharging", "networkStatus",
      "ipAddress", "siteName", "checkInTime", "checkOutTime", "totalDistanceTravelled",
      "journeyId", "isActive", "destLat", "destLng", "createdAt", "updatedAt", "salesmanEmail"],
  },
  {
    id: 'salesOrders',
    title: 'Sales Orders',
    columns: [ "id", "salesmanName", "salesmanRole", "salesmanEmail",
    "dealerName", "dealerType", "dealerPhone", "dealerAddress", "area", "region", "quantity", "unit",
     "orderTotal", "advancePayment", "pendingPayment", "estimatedDelivery", 
     "remarks", "createdAt", "updatedAt",],
  },
  {
    id: 'dailyTasks',
    title: 'Daily Tasks',
    columns: ["id", "taskDate", "visitType", "siteName", "description", "status", "pjpId",
      "createdAt", "updatedAt", "assignedToName", "assignedToEmail", "assignedByName",
      "assignedByEmail", "relatedDealerName"],
  },
  {
    id: 'salesReport',
    title: 'Sales Reports',
    columns: ["salesmanName", "area", "region", "dealerType", "dealerName", "subDealerName",
      "monthlyTargetMT", "tillDateAchievementMT", "yesterdaysTargetMT", "yesterdaysCollectionRupees"],
  },
  {
    id: 'collectionReport',
    title: 'Collection Reports',
    columns: ["id", "dvrId", "dealerId", "dealerName", "salesmanName", "collectedAmount",
      "collectedOnDate", "weeklyTarget", "tillDateAchievement", "yesterdayTarget",
      "yesterdayAchievement", "createdAt", "updatedAt"],
  },
  {
    id: 'ddpReport',
    title: 'DDP Reports',
    columns: ["id", "creationDate", "status", "obstacle", "dealerName", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'dealerBrandCapacities',
    title: 'Dealer Brand Capacities-Mapping',
    columns: ["dealerName", "brandName", "capacityMT", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'salesmanRating',
    title: 'Salesman Ratings',
    columns: ["id", "area", "region", "rating", "salesmanName", "salesmanEmail"],
  },
  {
    id: 'dealerReportsAndScores',
    title: 'Dealer Reports and Scores',
    columns: ["dealerName", "dealerScore", "trustWorthinessScore", "creditWorthinessScore",
      "orderHistoryScore", "visitFrequencyScore", "lastUpdatedDate", "salesmanName", "salesmanEmail"],
  },
];

export type ReportFormat = 'csv' | 'xlsx';

interface MasterCustomDownloadProps {
  onDownload: (format: ReportFormat, 
    selections:{ table: string, column: string }[]) => Promise<void>;
    isDownloading: boolean;
}

export function MasterCustomDownload({ onDownload, isDownloading }: MasterCustomDownloadProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<
    { table: string; column: string }[]>([]);
  const [format, setFormat] = useState<ReportFormat>('xlsx');

  const handleSelectColumn = (tableId: string, columnId: string) => {
    const newSelection = { table: tableId, column: columnId };
    setSelectedColumns(prev => {
      // Add or remove the column from the selection
      const isSelected = prev.some(s => s.table === tableId && s.column === columnId);
      if (isSelected) {
        return prev.filter(s => !(s.table === tableId && s.column === columnId));
      } else {
        return [...prev, newSelection];
      }
    });
  };

  const handleDownload = async () => {
    await onDownload(format, selectedColumns);
    setOpen(false);
  };

  const selectedCount = selectedColumns.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="space-x-2">
          <PlusCircle className="w-4 h-4" />
          <span>Custom Download</span>
          {selectedCount > 0 && (
            <span className="ml-2 text-xs bg-gray-200 text-gray-800 rounded-full px-2 py-1">
              {selectedCount} selected
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search tables and columns..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No results found.</CommandEmpty>

            {/* format switcher */}
            <div className="px-3 py-2 sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={format === 'xlsx' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('xlsx')}
                  className="gap-1"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  type="button"
                  variant={format === 'csv' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat('csv')}
                  className="gap-1"
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </Button>
              </div>
            </div>

            {tables.map(table => (
              <CommandGroup key={table.id} heading={table.title} className="p-2">
                {table.columns.map(column => {
                  const isSelected = selectedColumns.some(s => s.table === table.id && s.column === column);
                  return (
                    <CommandItem
                      key={`${table.id}-${column}`}
                      onSelect={() => handleSelectColumn(table.id, column)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckIcon className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <span>{column}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>

          <CommandSeparator />
          <div className="p-3">
            <h4 className="text-sm font-semibold mb-2">Selected Columns:</h4>
            <div className="flex flex-wrap gap-1 mb-3 max-h-[110px] overflow-y-auto">
              {selectedColumns.length ? (
                selectedColumns.map(s => (
                  <span key={`${s.table}-${s.column}`} className="bg-muted text-foreground/90 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {s.table}/{s.column}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No columns selected.</p>
              )}
            </div>
            <Button onClick={handleDownload} disabled={isDownloading || selectedColumns.length === 0} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : `Download as ${format.toUpperCase()}`}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
