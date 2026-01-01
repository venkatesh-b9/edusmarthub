import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
  avatar?: string;
}

const activities: Activity[] = [
  {
    id: '1',
    title: 'New student enrolled',
    description: 'Emily Johnson joined Grade 10-A',
    time: '2 minutes ago',
    type: 'success',
    avatar: 'EJ',
  },
  {
    id: '2',
    title: 'Assignment submitted',
    description: 'Math Quiz - 32 submissions received',
    time: '15 minutes ago',
    type: 'info',
  },
  {
    id: '3',
    title: 'Attendance alert',
    description: '3 students absent in Grade 8-B',
    time: '1 hour ago',
    type: 'warning',
  },
  {
    id: '4',
    title: 'Report generated',
    description: 'Monthly performance report ready',
    time: '2 hours ago',
    type: 'success',
  },
  {
    id: '5',
    title: 'System notification',
    description: 'Database backup completed',
    time: '3 hours ago',
    type: 'info',
  },
];

const typeStyles = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  error: 'bg-destructive/10 text-destructive',
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest updates across the system</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {activity.avatar ? (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {activity.avatar}
              </div>
            ) : (
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", typeStyles[activity.type])}>
                <div className="w-2.5 h-2.5 rounded-full bg-current" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
