import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  School, 
  Shield, 
  Building2, 
  GraduationCap, 
  Users, 
  ChevronRight,
  BarChart3,
  Lock,
  Zap,
  Globe,
} from 'lucide-react';

const roles = [
  {
    id: 'super-admin',
    title: 'Super Admin',
    description: 'Manage all schools, view global analytics, and configure system settings',
    icon: Shield,
    href: '/super-admin',
    color: 'from-purple-500 to-indigo-600',
    features: ['Global Analytics', 'School Management', 'System Health'],
  },
  {
    id: 'school-admin',
    title: 'School Admin',
    description: 'Manage your school, teachers, students, and resources',
    icon: Building2,
    href: '/school-admin',
    color: 'from-blue-500 to-cyan-500',
    features: ['Staff Management', 'Student Records', 'Financial Reports'],
  },
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Manage classes, track attendance, and grade assignments',
    icon: GraduationCap,
    href: '/teacher',
    color: 'from-emerald-500 to-teal-500',
    features: ['Class Management', 'Gradebook', 'Lesson Planning'],
  },
  {
    id: 'parent',
    title: 'Parent',
    description: "Monitor your child's progress, attendance, and communicate with teachers",
    icon: Users,
    href: '/parent',
    color: 'from-orange-500 to-amber-500',
    features: ['Student Progress', 'Attendance', 'Fee Payments'],
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time insights with interactive charts and predictive analytics',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Role-based access control with multi-tenant architecture',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Instant notifications and live data synchronization',
  },
  {
    icon: Globe,
    title: 'Multi-language',
    description: 'Support for 20+ languages with RTL compatibility',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-30" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-8"
            >
              <School className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Welcome to{' '}
              <span className="text-gradient">EduCloud</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            >
              The enterprise-grade School Management System that connects administrators, 
              teachers, and parents for a seamless educational experience.
            </motion.p>

            {/* Role Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Select your role to explore the dashboard
              </p>
            </motion.div>
          </motion.div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <Link to={role.href} className="block group">
                  <div className="relative bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <role.icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {role.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {role.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Enter Dashboard
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with scalability, security, and performance in mind
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">EduCloud</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 EduCloud. Enterprise School Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}
