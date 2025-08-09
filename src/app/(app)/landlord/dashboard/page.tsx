
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Building, DollarSign, FileText, PlusCircle, Wrench } from "lucide-react"

const landlordData = {
  metrics: [
    { title: "Active Listings", value: 5, icon: Building, change: "+1 this month" },
    { title: "Occupancy Rate", value: "92%", icon: FileText, change: "8% vacancy" },
    { title: "Pending Applications", value: 3, icon: FileText, change: "2 new" },
    { title: "Monthly Revenue", value: "$12,800", icon: DollarSign, change: "+3.2%" },
  ],
  properties: [
    { id: 'prop2', name: "Cozy Downtown Apartment", occupancy: "1/1 Occupied", issues: 0, revenue: 3200 },
    { id: 'prop3', name: "Suburban Family Home", occupancy: "0/1 Vacant", issues: 1, revenue: 0 },
    { id: 'prop5', name: "Miami Beachfront Condo", occupancy: "1/1 Occupied", issues: 0, revenue: 4500 },
  ],
  recentActivity: [
    { type: "application", text: "New application for 'Suburban Family Home' from Sarah L.", link: "#" },
    { type: "maintenance", text: "Maintenance request for 'Cozy Downtown Apartment': Leaky faucet", link: "#" },
    { type: "payment", text: "Payment of $3,200 received from tenant at 'Cozy Downtown Apartment'", link: "#" },
  ]
}

export default function LandlordDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold font-headline md:text-4xl">Landlord Dashboard</h1>
        <p className="text-muted-foreground mt-2">Oversee your properties, tenants, and financials at a glance.</p>
      </section>

      {/* Key Metrics */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {landlordData.metrics.map((metric) => (
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

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            {/* My Properties */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">My Properties</CardTitle>
                        <CardDescription>An overview of your managed properties.</CardDescription>
                    </div>
                    <Button asChild size="sm">
                        <Link href="#"><PlusCircle className="mr-2 h-4 w-4"/> Add Property</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Occupancy</TableHead>
                                <TableHead>Open Issues</TableHead>
                                <TableHead className="text-right">Monthly Rent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {landlordData.properties.map((prop) => (
                                <TableRow key={prop.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/property/${prop.id}`} className="hover:underline">{prop.name}</Link>
                                </TableCell>
                                <TableCell>{prop.occupancy}</TableCell>
                                <TableCell>
                                    <Badge variant={prop.issues > 0 ? "destructive" : "secondary"}>{prop.issues}</Badge>
                                </TableCell>
                                <TableCell className="text-right">${prop.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {landlordData.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="mt-1">
                                {activity.type === 'application' && <FileText className="h-4 w-4 text-muted-foreground" />}
                                {activity.type === 'maintenance' && <Wrench className="h-4 w-4 text-muted-foreground" />}
                                {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {activity.text}
                                <Link href={activity.link} className="text-primary hover:underline ml-1">View</Link>
                            </p>
                        </div>
                    ))}
                </CardContent>
            </Card>

             {/* Financial Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">October Revenue</span>
                            <span className="text-sm font-semibold">$12,800 / $17,300</span>
                        </div>
                        <Progress value={74} />
                    </div>
                     <Button variant="outline" className="w-full">View Financial Report <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
