'use client';

import { Pie, PieChart, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { type ChartConfig } from '@/components/ui/chart';

interface StudentEnrollmentChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}

const chartConfig: ChartConfig = {};
const generateConfig = (data: StudentEnrollmentChartProps['data']) => {
    data.forEach(item => {
        chartConfig[item.name] = {
            label: `Class ${item.name}`,
            color: item.fill,
        };
    });
    return chartConfig;
}

export function StudentEnrollmentChart({ data }: StudentEnrollmentChartProps) {
  const generatedChartConfig = generateConfig(data);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Student Enrollment by Class</CardTitle>
        <CardDescription>
          Distribution of students across different classes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={generatedChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
