
import Image from "next/image"
import Link from "next/link"
import { applications } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function getStatusVariant(status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected') {
    switch (status) {
        case 'Approved':
            return 'default';
        case 'Under Review':
            return 'secondary';
        case 'Rejected':
            return 'destructive';
        case 'Submitted':
        default:
            return 'outline';
    }
}

export default function ApplicationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold font-headline md:text-4xl">My Applications</h1>
        <p className="text-muted-foreground mt-2">
          Track the status of your submitted applications and offers.
        </p>
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {applications.map((app) => (
              <div key={app.id} className="p-6 grid grid-cols-1 md:grid-cols-4 items-center gap-4 hover:bg-muted/50">
                <div className="flex items-center gap-4 md:col-span-2">
                  <Image
                    src={app.propertyImage}
                    alt={app.propertyTitle}
                    width={100}
                    height={75}
                    className="rounded-lg object-cover aspect-video"
                    data-ai-hint="house exterior"
                  />
                  <div>
                    <Link href={`/property/${app.propertyId}`} className="font-semibold hover:underline">
                      {app.propertyTitle}
                    </Link>
                    <p className="text-sm text-muted-foreground">{app.type} Application</p>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                </div>
                <div className="flex flex-col items-end text-right">
                   <p className="text-sm text-muted-foreground">Submitted: {new Date(app.dateSubmitted).toLocaleDateString()}</p>
                   <Button variant="outline" size="sm" className="mt-2">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        {applications.length === 0 && (
            <Card className="text-center p-12">
                <p className="text-lg text-muted-foreground">You haven't submitted any applications yet.</p>
                <p className="text-muted-foreground">Once you apply for a property, it will show up here.</p>
            </Card>
        )}
    </div>
  )
}
