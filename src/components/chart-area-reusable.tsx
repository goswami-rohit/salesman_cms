"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   ToggleGroup,
//   ToggleGroupItem,
// } from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

// Define a generic type for the data
type ChartDataItem = {
  name: string;
  [key: string]: string | number | undefined; // Allow for dynamic keys like 'visits' or 'distance'
};

// Define the props for our new, flexible component
interface ChartAreaInteractiveProps {
  data: ChartDataItem[];
  dataKey: string;
  title?: string; // Optional title for the chart
}

// Now, we modify the component to accept and use the props
export function ChartAreaInteractive({ data, dataKey, title }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();

  // Dynamically create the ChartConfig based on the dataKey
  const chartConfig = {
    [dataKey]: {
      label: title || dataKey, // Use the provided title or the dataKey as a fallback
      color: "hsl(var(--chart-1))", // You can set a default color here
    },
    // The date is used for the x-axis, so we don't need to configure it here
  } satisfies ChartConfig;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title || "Interactive Chart"}</CardTitle>
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
              dataKey={dataKey} // Use the dataKey prop
              type="natural"
              fill="var(--color-primary)" // You might need to adjust this
              stroke="var(--color-primary)" // You might need to adjust this
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

