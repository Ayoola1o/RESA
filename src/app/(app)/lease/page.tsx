
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FileDown, FileSignature, AlertCircle } from "lucide-react"

const leaseDetails = {
    property: "Cozy Downtown Apartment",
    address: "456 Urban St, Apt 12B, San Francisco, CA 94105",
    term: "12 Months",
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    rent: 3200,
    securityDeposit: 3200,
    status: "Active",
    renewalNoticeDate: "2024-05-31",
}

export default function LeasePage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold font-headline md:text-4xl">My Lease Agreement</h1>
        <p className="text-muted-foreground mt-2">
          View your current lease details and important documents.
        </p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2"><FileSignature className="h-6 w-6 text-primary"/>Lease for {leaseDetails.property}</CardTitle>
              <CardDescription>{leaseDetails.address}</CardDescription>
            </div>
            <Badge variant={leaseDetails.status === 'Active' ? 'default' : 'secondary'}>{leaseDetails.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Lease Term</p>
                <p className="text-lg font-semibold">{leaseDetails.term}</p>
            </div>
             <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold">{new Date(leaseDetails.startDate).toLocaleDateString()}</p>
            </div>
             <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p className="text-lg font-semibold">{new Date(leaseDetails.endDate).toLocaleDateString()}</p>
            </div>
             <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-semibold">${leaseDetails.rent.toLocaleString()}</p>
            </div>
          </div>
          <Separator />
           <div>
              <h3 className="text-lg font-semibold mb-2 font-headline">Key Terms & Clauses</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>No smoking is permitted inside the unit.</li>
                  <li>Pets are allowed with a one-time pet fee of $500.</li>
                  <li>Late rent payments are subject to a 5% late fee after a 3-day grace period.</li>
                  <li>Tenant is responsible for electricity and internet utilities.</li>
              </ul>
           </div>
           <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-yellow-800">Renewal Notice</h4>
                        <p className="text-sm text-yellow-700">Your lease is up for renewal. Please make a decision by {new Date(leaseDetails.renewalNoticeDate).toLocaleDateString()} to renew or terminate your lease.</p>
                    </div>
                </div>
           </div>
        </CardContent>
        <CardFooter className="gap-4">
          <Button size="lg"><FileSignature className="mr-2"/> Renew Lease</Button>
          <Button size="lg" variant="outline"><FileDown className="mr-2"/> Download Lease (PDF)</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
