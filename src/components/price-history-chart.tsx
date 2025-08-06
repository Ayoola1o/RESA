
'use client';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--primary))",
  },
}

interface PriceHistoryChartProps {
    data: { date: string; price: number; label: string }[];
}

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <AreaChart data={data} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${Number(value) / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                    dataKey="price"
                    type="natural"
                    fill="var(--color-price)"
                    fillOpacity={0.4}
                    stroke="var(--color-price)"
                />
            </AreaChart>
        </ChartContainer>
    )
}
