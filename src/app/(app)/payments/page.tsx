
'use client';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Wallet, Banknote, CheckCircle, RefreshCw } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const paymentHistory = [
    { id: 'pay_1', date: '2023-11-01', amount: 3200, status: 'Paid', method: 'ACH' },
    { id: 'pay_2', date: '2023-10-01', amount: 3200, status: 'Paid', method: 'Credit Card' },
    { id: 'pay_3', date: '2023-09-01', amount: 3200, status: 'Paid', method: 'ACH' },
]

export default function PaymentsPage() {

  return (
    <div className="flex flex-col gap-8">
       <section>
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Manage Payments</h1>
        <p className="text-muted-foreground mt-2">
          Pay your rent, view history, and set up automatic payments.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
           <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Upcoming Payment</CardTitle>
                    <CardDescription>Your next rent payment is due December 1, 2023.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 flex justify-between items-center bg-muted/20">
                        <p className="text-lg font-semibold">Rent for December</p>
                        <p className="text-2xl font-bold text-primary">$3,200.00</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select defaultValue="ach">
                            <SelectTrigger id="paymentMethod">
                                <SelectValue placeholder="Select a payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ach">Bank Account (ACH)</SelectItem>
                                <SelectItem value="cc">Credit Card</SelectItem>
                                <SelectItem value="wallet">Mobile Wallet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full">
                        <CreditCard className="mr-2" /> Pay $3,200.00 Now
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentHistory.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.date}</TableCell>
                                    <TableCell>${p.amount.toLocaleString()}</TableCell>
                                    <TableCell>{p.method}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="default" className="bg-green-600">
                                            <CheckCircle className="mr-1 h-3 w-3"/>
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Auto-Pay</CardTitle>
                    <CardDescription>Set up recurring payments so you never miss a due date.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-6">
                   <div className="flex items-center gap-2">
                     <RefreshCw className="h-5 w-5 text-primary"/>
                     <Label htmlFor="autopay-switch" className="text-base">Enable Auto-Pay</Label>
                   </div>
                    <Switch id="autopay-switch" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="border p-3 rounded-lg flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><Banknote/> Bank of America ....1234</span>
                        <Badge variant="secondary">Primary</Badge>
                    </div>
                     <div className="border p-3 rounded-lg flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2"><CreditCard/> Visa ....5678</span>
                    </div>
                    <Button variant="outline" className="w-full">Add a Method</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
