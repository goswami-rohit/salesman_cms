// src/app/components/chart-area-reusable.tsx
"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Sector,
  Tooltip,
} from "recharts"

import { useIsMobile } from "@/hooks/use-mobile" // Placeholder for mobile check
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend, // Using ChartLegend for pie chart legend
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Define a generic type for the data
type ChartDataItem = {
  name: string | number; // Common key for name/date
  [key: string]: string | number | undefined; // Allow for dynamic keys like 'visits' or 'distance'
};

// --- CHART: AREA INTERACTIVE ---

// Define the props for the flexible Area chart
interface ChartAreaInteractiveProps {
  data: ChartDataItem[];
  dataKey: string;
  title?: string; // Optional title for the chart
  lineStroke?: string;
  fillColor?: string;
}

export function ChartAreaInteractive({ data, dataKey, title }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();

  // Dynamically create the ChartConfig based on the dataKey
  const chartConfig = {
    [dataKey]: {
      label: title || dataKey,
      color: "hsl(var(--chart-1))", // Use a standard chart color variable
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title || "Interactive Area Chart"}</CardTitle>
        <CardDescription>
          Showing {title || dataKey} over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={dataKey}
              type="natural"
              fill="var(--color-chart-1)" // Using the config color
              stroke="var(--color-chart-1)" // Using the config color
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


// --- CHART: PIE REUSABLE ---

// Define the props for the reusable Pie chart
interface ChartPieReusableProps {
  data: ChartDataItem[];
  dataKey: string; // The value (e.g., 'amount', 'percentage')
  nameKey: string; // The name (e.g., 'category', 'role', 'name')
  title?: string;
  description?: string;
}

// Fixed color array for the chart palette
const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

/**
 * Custom render function for the active (hovered) pie slice.
 * This function makes the slice visually 'pop' out.
 */
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * (startAngle + endAngle) / 2);
  const cos = Math.cos(-RADIAN * (startAngle + endAngle) / 2);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;

  return (
    <g>
      {/* Expanded Outer Sector (for hover effect) */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Slightly expanded radius
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="stroke-background"
      />
      {/* White circle at the center of the expanded slice */}
      <circle cx={sx} cy={sy} r={2} fill="hsl(var(--background))" />
      {/* Display name and value near the slice */}
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="font-semibold">
        {payload[props.nameKey]}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        {value.toLocaleString()}
      </text>
    </g>
  );
};


export function ChartPieReusable({ data, dataKey, nameKey, title, description }: ChartPieReusableProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 300, height: 200 });

  // 1. Dynamically create the ChartConfig for the legend
  const chartConfig: ChartConfig = data.reduce((acc, item, index) => {
    const key = item[nameKey] as string;
    if (key) {
      acc[key] = {
        label: key,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    }
    return acc;
  }, {} as ChartConfig);

  // 2. Adjust chart size based on container width
  React.useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        // Keep a reasonable aspect ratio, slightly taller for mobile
        const newHeight = newWidth < 640 ? Math.min(newWidth * 0.9, 300) : Math.min(newWidth * 0.7, 400);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 3. Handlers for interaction
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  // Check if data is empty or invalid
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title || "Reusable Pie Chart"}</CardTitle>
          <CardDescription>{description || "Distribution breakdown."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No data available to display pie chart.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg" ref={containerRef}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title || "Reusable Pie Chart"}</CardTitle>
        <CardDescription>{description || "Distribution breakdown."}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[400px] lg:max-h-[500px]"
          style={{ width: size.width, height: size.height }}
        >
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey={nameKey} />} />
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={size.width * 0.15} // Inner radius dynamically sized
              outerRadius={size.width * 0.3}  // Outer radius dynamically sized
              paddingAngle={2}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              //activeIndex={activeIndex}
              activeShape={(props: any) => renderActiveShape({ ...props, nameKey })} // Pass nameKey to active shape renderer
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  className="stroke-background transition-opacity"
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegend />} className="pt-2" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
