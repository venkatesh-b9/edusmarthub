import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Search,
  Download,
  FileText,
  File,
  Image,
  Folder,
  Upload,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const children = [
  { id: 1, name: 'Emma Martinez', grade: '10-A', photo: 'EM' },
  { id: 2, name: 'Lucas Martinez', grade: '7-B', photo: 'LM' },
];

const documents = [
  {
    id: 1,
    name: 'Report Card - Fall 2025',
    type: 'pdf',
    category: 'Academic',
    child: 'Emma Martinez',
    date: 'Dec 20, 2025',
    size: '245 KB',
    icon: FileText,
  },
  {
    id: 2,
    name: 'Attendance Certificate',
    type: 'pdf',
    category: 'Academic',
    child: 'Emma Martinez',
    date: 'Dec 15, 2025',
    size: '128 KB',
    icon: FileText,
  },
  {
    id: 3,
    name: 'School Annual Fee Receipt',
    type: 'pdf',
    category: 'Financial',
    child: 'Both',
    date: 'Jan 1, 2026',
    size: '156 KB',
    icon: File,
  },
  {
    id: 4,
    name: 'Science Fair Certificate',
    type: 'image',
    category: 'Awards',
    child: 'Emma Martinez',
    date: 'Nov 18, 2025',
    size: '1.2 MB',
    icon: Image,
  },
  {
    id: 5,
    name: 'Report Card - Fall 2025',
    type: 'pdf',
    category: 'Academic',
    child: 'Lucas Martinez',
    date: 'Dec 20, 2025',
    size: '238 KB',
    icon: FileText,
  },
  {
    id: 6,
    name: 'Art Exhibition Certificate',
    type: 'image',
    category: 'Awards',
    child: 'Lucas Martinez',
    date: 'Oct 25, 2025',
    size: '980 KB',
    icon: Image,
  },
  {
    id: 7,
    name: 'Medical Form',
    type: 'pdf',
    category: 'Health',
    child: 'Emma Martinez',
    date: 'Sep 1, 2025',
    size: '312 KB',
    icon: FileText,
  },
  {
    id: 8,
    name: 'Permission Slip - Field Trip',
    type: 'pdf',
    category: 'Administrative',
    child: 'Both',
    date: 'Jan 3, 2026',
    size: '85 KB',
    icon: File,
  },
];

const folders = [
  { name: 'Academic Records', count: 8, icon: Folder },
  { name: 'Financial Documents', count: 5, icon: Folder },
  { name: 'Certificates & Awards', count: 4, icon: Folder },
  { name: 'Health Records', count: 2, icon: Folder },
  { name: 'Administrative', count: 3, icon: Folder },
];

const recentActivity = [
  { action: 'Downloaded', document: 'Report Card - Fall 2025', time: '2 hours ago' },
  { action: 'Viewed', document: 'Fee Receipt', time: '1 day ago' },
  { action: 'Uploaded', document: 'Medical Certificate', time: '3 days ago' },
];

export default function ParentDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChild = selectedChild === 'all' || doc.child === selectedChild || doc.child === 'Both';
    const matchesCategory = selectedCategory === 'all' || doc.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesChild && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Access and manage school documents
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button className="gap-2 gradient-primary text-white">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.name}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="awards">Awards</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-card rounded-xl border p-4 shadow-card">
              <h3 className="font-semibold mb-4">Folders</h3>
              <div className="space-y-2">
                {folders.map((folder, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <folder.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{folder.count}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border p-4 shadow-card">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>{' '}
                        <span className="text-muted-foreground">{activity.document}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Documents Grid */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="grid" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredDocuments.length} documents found
                </p>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="grid" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl border p-4 shadow-card hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          doc.type === 'pdf' ? "bg-destructive/10" : "bg-primary/10"
                        )}>
                          <doc.icon className={cn(
                            "w-6 h-6",
                            doc.type === 'pdf' ? "text-destructive" : "text-primary"
                          )} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{doc.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{doc.child}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{doc.date}</span>
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list" className="mt-4">
                <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                  <div className="divide-y">
                    {filteredDocuments.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            doc.type === 'pdf' ? "bg-destructive/10" : "bg-primary/10"
                          )}>
                            <doc.icon className={cn(
                              "w-5 h-5",
                              doc.type === 'pdf' ? "text-destructive" : "text-primary"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">{doc.child} • {doc.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{doc.category}</Badge>
                          <span className="text-sm text-muted-foreground">{doc.date}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
