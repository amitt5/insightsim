import { TableCell } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCircle, CreditCard, Building } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="team">
        <TabsList className="mb-4">
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage who has access to your InsightSim workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-gray-500">sarah@acmeresearch.com</p>
                    </div>
                  </div>
                  <Badge>Admin</Badge>
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500">john@acmeresearch.com</p>
                    </div>
                  </div>
                  <Badge variant="outline">Member</Badge>
                </div>

                <div className="flex items-center justify-between rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>AL</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Amy Lee</p>
                      <p className="text-sm text-gray-500">amy@acmeresearch.com</p>
                    </div>
                  </div>
                  <Badge variant="outline">Member</Badge>
                </div>

                <Button className="mt-4">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Current Plan</h3>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Professional Plan</p>
                        <p className="text-sm text-gray-500">$99/month, billed monthly</p>
                      </div>
                      <Button variant="outline">Change Plan</Button>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="secondary">10 users included</Badge>
                      <Badge variant="secondary">Unlimited simulations</Badge>
                      <Badge variant="secondary">Advanced reporting</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Payment Method</h3>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/2026</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Billing History</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Apr 1, 2025</TableCell>
                          <TableCell>$99.00</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mar 1, 2025</TableCell>
                          <TableCell>$99.00</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Paid
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Manage your organization details and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Acme Research" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email">Organization Email</Label>
                  <Input id="org-email" defaultValue="admin@acmeresearch.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">Address</Label>
                  <Input id="org-address" defaultValue="123 Market Street" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-city">City</Label>
                    <Input id="org-city" defaultValue="San Francisco" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-state">State</Label>
                    <Input id="org-state" defaultValue="CA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-zip">ZIP Code</Label>
                    <Input id="org-zip" defaultValue="94103" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-country">Country</Label>
                  <Input id="org-country" defaultValue="United States" />
                </div>

                <Button className="mt-4">
                  <Building className="mr-2 h-4 w-4" />
                  Update Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
