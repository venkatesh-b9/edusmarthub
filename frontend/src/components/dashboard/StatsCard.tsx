import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
  delay?: number;
  href?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    iconBg: 'bg-muted',
    iconColor: 'text-foreground',
  },
  primary: {
    bg: 'bg-card',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  accent: {
    bg: 'bg-card',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
  delay = 0,
  href,
}: StatsCardProps) {
  const navigate = useNavigate();
  const styles = variantStyles[variant];
  const isPositive = change && change.value >= 0;

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={handleClick}
      className={cn(
        "relative rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300",
        styles.bg,
        href && "cursor-pointer hover:scale-[1.02]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="text-3xl font-bold tracking-tight"
          >
            {value}
          </motion.p>
          {change && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="text-sm text-muted-foreground">{change.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.iconBg)}>
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
