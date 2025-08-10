
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, DollarSign, MinusCircle, PlusCircle, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const financialData = {
  summary: [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1% from last month", icon: DollarSign },
    { title: "Total Expenses", value: "$12,874.21", change: "+12.5% from last month", icon: DollarSign },
    { title: "Net Income", value: "$32,357.68", change: "+23.3% from last month", icon: DollarSign },
    { title: "Occupancy Rate", value: "92%", change: "2 vacant units", icon: Users },
  ],
  chartData: [
    { month: "Jan", income: 4000, expense: 2400 },
    { month: "Feb", income: 3000, expense: 1398 },
    { month: "Mar", income: 5000, expense: 6800 },
    { month: "Apr", income: 2780, expense: 3908 },
    { month: "May", income: 1890, expense: 4800 },
    { month: "Jun", income: 2390, expense: 3800 },
    { month: "Jul", income: 3490, expense: 4300 },
  ],
  transactions: [
    { id: 'txn1', date: '2023-11-28', description: "Rent Payment - Unit 12B", category: 'Income', amount: 3200 },
    { id: 'txn2', date: '2023-11-25', description: "Plumbing Repair - Unit 5A", category: 'Maintenance', amount: -450 },
    { id: 'txn3', date: '2023-11-22', description: "Landscaping Services", category: 'Property Services', amount: -250 },
    { id: 'txn4', date: '2023-11-20', description: "Late Fee - Unit 8C", category: 'Income', amount: 50 },
    { id: 'txn5', date: '2023-11-18', description: "Property Insurance Premium", category: 'Insurance', amount: -1200 },
  ]
};

export default function FinancialsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Financials</h1>
        <p className="text-muted-foreground mt-2">Track your income, expenses, and overall financial health.</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {financialData.summary.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Income vs. Expense</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financialData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                        <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expense" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Recent Transactions</CardTitle>
                    <CardDescription>A log of your most recent income and expenses.</CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button size="sm" variant="outline"><MinusCircle className="mr-2"/> Add Expense</Button>
                    <Button size="sm"><PlusCircle className="mr-2"/> Add Income</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {financialData.transactions.map((txn) => (
                            <TableRow key={txn.id}>
                                <TableCell>{txn.date}</TableCell>
                                <TableCell className="font-medium">{txn.description}</TableCell>
                                <TableCell><Badge variant="outline">{txn.category}</Badge></TableCell>
                                <TableCell className={`text-right font-semibold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
