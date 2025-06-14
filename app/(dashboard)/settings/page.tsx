"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Download, 
  Trash2, 
  CreditCard, 
  Building, 
  Users, 
  BarChart3,
  Upload,
  Eye,
  EyeOff,
  Plus,
  MoreHorizontal,
  Crown,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    security: true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and organization preferences</p>
        </div>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-lg">SJ</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div> */}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Sarah" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Johnson" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="sarah.johnson@acmeresearch.com" />
              </div>
              
              {/* <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="pst">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                    <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                    <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Password & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Security
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" placeholder="Enter new password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                </div>
              </div>
              
              <Separator />
             
              
              <Button>Update Security Settings</Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export your data or delete your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Export Account Data</p>
                  <p className="text-sm text-gray-500">Download all your simulations and data</p>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
                <div>
                  <p className="font-medium text-red-700">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Your subscription details and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Professional Plan</h3>
                  <p className="text-blue-700">$99/month • Billed monthly</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">10 users included</Badge>
                    <Badge variant="secondary">Unlimited simulations</Badge>
                    <Badge variant="secondary">Advanced reporting</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">$99</p>
                  <p className="text-sm text-blue-700">per month</p>
                  <Button className="mt-2">Upgrade Plan</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">847</p>
                  <p className="text-sm text-gray-600">Simulations this month</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">12.4K</p>
                  <p className="text-sm text-gray-600">Credits used</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-gray-600">Active users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Metrics
              </CardTitle>
              <CardDescription>Track your monthly usage and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Simulations</span>
                    <span className="text-sm text-gray-600">847 / 1,000</span>
                  </div>
                  <Progress value={84.7} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Credits</span>
                    <span className="text-sm text-gray-600">12,400 / 15,000</span>
                  </div>
                  <Progress value={82.7} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Team Members</span>
                    <span className="text-sm text-gray-600">8 / 10</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/2026</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">Default</Badge>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>View your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Dec 1, 2024</TableCell>
                    <TableCell>Professional Plan - Monthly</TableCell>
                    <TableCell>$99.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Download</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Nov 1, 2024</TableCell>
                    <TableCell>Professional Plan - Monthly</TableCell>
                    <TableCell>$99.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Download</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Oct 1, 2024</TableCell>
                    <TableCell>Professional Plan - Monthly</TableCell>
                    <TableCell>$99.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Download</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Manage your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-sm text-gray-500">PNG or SVG. Max size 2MB.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" defaultValue="Acme Research Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select defaultValue="research">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Market Research</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input id="companyEmail" defaultValue="admin@acmeresearch.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" defaultValue="https://acmeresearch.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea 
                  id="description" 
                  defaultValue="Leading market research firm specializing in consumer insights and behavioral analysis."
                  rows={3}
                />
              </div>
              
              <Button>Save Company Information</Button>
            </CardContent>
          </Card>

          {/* Branding Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>Customize how your brand appears in reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input id="primaryColor" defaultValue="#3B82F6" className="w-20" />
                    <div className="w-10 h-10 bg-blue-500 rounded border"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input id="secondaryColor" defaultValue="#64748B" className="w-20" />
                    <div className="w-10 h-10 bg-slate-500 rounded border"></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select defaultValue="inter">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button>Save Branding Settings</Button>
            </CardContent>
          </Card>

          {/* Report Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Report Preferences</CardTitle>
              <CardDescription>Set default preferences for generated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Include Company Logo</p>
                  <p className="text-sm text-gray-500">Show logo on all reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Participant Details</p>
                  <p className="text-sm text-gray-500">Include participant information in reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Executive Summary</p>
                  <p className="text-sm text-gray-500">Auto-generate executive summaries</p>
                </div>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportFormat">Default Report Format</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                    <SelectItem value="pptx">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>Manage who has access to your InsightSim workspace</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Member 1 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">sarah.johnson@acmeresearch.com</p>
                    <p className="text-xs text-gray-400">Last active: 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Owner</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Team Member 2 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-gray-500">john.doe@acmeresearch.com</p>
                    <p className="text-xs text-gray-400">Last active: 1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Admin</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Team Member 3 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Amy Lee</p>
                    <p className="text-sm text-gray-500">amy.lee@acmeresearch.com</p>
                    <p className="text-xs text-gray-400">Last active: 3 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Member</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Team Member 4 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>MR</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Mike Rodriguez</p>
                    <p className="text-sm text-gray-500">mike.rodriguez@acmeresearch.com</p>
                    <p className="text-xs text-gray-400">Last active: 1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Member</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>View Activity</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Pending Invitations */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Pending Invitations</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">lisa.chen@acmeresearch.com</p>
                      <p className="text-sm text-gray-500">Invited 2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                    <Button variant="ghost" size="sm">Resend</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage & Limits Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Simulations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
                <Progress value={84.7} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">847 / 1,000 limit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.4K</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
                <Progress value={82.7} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">12,400 / 15,000 limit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
                <Progress value={80} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">8 / 10 limit</p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Trends
              </CardTitle>
              <CardDescription>Your usage patterns over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium">Jul</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">642</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Aug</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '75%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">723</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sep</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '45%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">534</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Oct</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '90%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">891</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nov</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '70%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">756</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dec</p>
                    <div className="mt-2 h-20 bg-blue-100 rounded flex items-end justify-center">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '85%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">847</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Usage Breakdown</CardTitle>
              <CardDescription>Current month usage by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Focus Groups</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">423 simulations</p>
                    <p className="text-sm text-gray-500">6,847 credits</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Interviews</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">312 simulations</p>
                    <p className="text-sm text-gray-500">4,234 credits</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Surveys</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">112 simulations</p>
                    <p className="text-sm text-gray-500">1,319 credits</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Prompt */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Crown className="h-5 w-5" />
                Approaching Your Limits
              </CardTitle>
              <CardDescription className="text-blue-700">
                You're using 84% of your monthly simulation limit. Consider upgrading for unlimited access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Enterprise Plan</p>
                  <p className="text-sm text-blue-700">Unlimited simulations • Advanced analytics • Priority support</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
