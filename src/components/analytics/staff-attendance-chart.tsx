'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { type ChartConfig } from '@/components/ui/chart';

interface StaffAttendanceChartProps {
  data: {
    date: string;
    present: number;
  }[];
}

const chartConfig = {
  present: {
    label: 'Present Staff',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function StaffAttendanceChart({ data }: StaffAttendanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Attendance - Last 7 Days</CardTitle>
        <CardDescription>
          Daily count of staff members marked as present.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="present" fill="var(--color-present)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
