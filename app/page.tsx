import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Webhook, Calendar } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">MTG Event Management System</h1>
        <p className="text-xl text-muted-foreground">
          PayPal webhook integration and table management for Magic: The Gathering events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Handler
            </CardTitle>
            <CardDescription>Automatically processes PayPal payments and creates reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Endpoint: <code>/api/webhook/paypal</code>
            </p>
            <p className="text-sm">
              Configure this URL in your PayPal webhook settings to automatically process payments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Table Management
            </CardTitle>
            <CardDescription>Organize players into tables and manage seating assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Automatically assigns players to tables of 4. Managers can reassign players as needed.
            </p>
            <Link href="/manager">
              <Button className="w-full">Open Manager Dashboard</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Tracking
            </CardTitle>
            <CardDescription>Track reservations, revenue, and player counts by event date</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              View comprehensive statistics and manage multiple event dates from the manager dashboard.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Database Setup</h4>
              <p className="text-sm text-muted-foreground">
                Run the SQL script in the scripts folder to create the necessary tables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">2. Environment Variables</h4>
              <p className="text-sm text-muted-foreground">
                Set <code>DATABASE_URL</code> and <code>PAYPAL_WEBHOOK_ID</code> in your environment.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">3. PayPal Webhook Configuration</h4>
              <p className="text-sm text-muted-foreground">
                Configure your PayPal webhook to send <code>PAYMENT.SALE.COMPLETED</code> events to{" "}
                <code>/api/webhook/paypal</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
