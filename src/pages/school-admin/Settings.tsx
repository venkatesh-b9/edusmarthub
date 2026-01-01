import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  Shield,
  Palette,
  Upload,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage school configuration and preferences
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="school" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="school" className="gap-2">
              <Building2 className="w-4 h-4 hidden sm:block" />
              School
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4 hidden sm:block" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2">
              <Calendar className="w-4 h-4 hidden sm:block" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4 hidden sm:block" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4 hidden sm:block" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* School Info Tab */}
          <TabsContent value="school">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6"
            >
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">School Logo</h3>
                  <p className="text-sm text-muted-foreground">Upload your school logo</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input id="schoolName" defaultValue="Lincoln High School" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School Code</Label>
                  <Input id="schoolCode" defaultValue="LHS-2025" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="admin@lincoln-high.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" defaultValue="123 Education Lane, Academic City, AC 12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://lincoln-high.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="america-new-york">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-new-york">America/New York (EST)</SelectItem>
                      <SelectItem value="america-chicago">America/Chicago (CST)</SelectItem>
                      <SelectItem value="america-denver">America/Denver (MST)</SelectItem>
                      <SelectItem value="america-los-angeles">America/Los Angeles (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6"
            >
              <h3 className="font-semibold">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: 'attendance', label: 'Attendance Alerts', description: 'Get notified when attendance falls below threshold' },
                  { id: 'fees', label: 'Fee Payment Reminders', description: 'Automatic reminders for pending fee payments' },
                  { id: 'events', label: 'Event Notifications', description: 'Updates about upcoming school events' },
                  { id: 'reports', label: 'Report Generation', description: 'Notifications when reports are ready' },
                  { id: 'staff', label: 'Staff Updates', description: 'Updates about staff changes and announcements' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select defaultValue="2025-2026">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                      <SelectItem value="2026-2027">2026-2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grading System</Label>
                  <Select defaultValue="letter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter Grade (A-F)</SelectItem>
                      <SelectItem value="percentage">Percentage (0-100)</SelectItem>
                      <SelectItem value="gpa">GPA (0.0-4.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Attendance Threshold (%)</Label>
                  <Input type="number" defaultValue="75" min="50" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Class Duration (minutes)</Label>
                  <Input type="number" defaultValue="45" min="30" max="90" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Academic Periods</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="font-medium">Semester 1</p>
                    <p className="text-sm text-muted-foreground">Aug 15, 2025 - Dec 20, 2025</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="font-medium">Semester 2</p>
                    <p className="text-sm text-muted-foreground">Jan 5, 2026 - May 30, 2026</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6"
            >
              <div className="space-y-4">
                {[
                  { id: '2fa', label: 'Two-Factor Authentication', description: 'Require 2FA for all admin accounts', defaultChecked: true },
                  { id: 'session', label: 'Session Timeout', description: 'Automatically log out after 30 minutes of inactivity', defaultChecked: true },
                  { id: 'ip', label: 'IP Whitelisting', description: 'Restrict access to specific IP addresses', defaultChecked: false },
                  { id: 'audit', label: 'Audit Logging', description: 'Log all administrative actions', defaultChecked: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mt-1">These actions are irreversible</p>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="text-destructive border-destructive/50">
                    Reset All Passwords
                  </Button>
                  <Button variant="outline" className="text-destructive border-destructive/50">
                    Clear All Sessions
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-3">
                    {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-foreground/20 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dashboard Layout</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Compact Sidebar</p>
                    <p className="text-sm text-muted-foreground">Use icon-only sidebar</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Show Welcome Banner</p>
                    <p className="text-sm text-muted-foreground">Display welcome message on dashboard</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2 gradient-primary text-white">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
