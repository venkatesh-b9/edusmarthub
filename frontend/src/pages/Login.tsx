import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Lock, 
  Building2, 
  Eye, 
  EyeOff, 
  Loader2,
  XCircle,
  Globe,
  Bot,
  Users,
  BarChart3,
  School,
  Lightbulb,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { authService } from '@/lib/api';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EduSmartHubLogo } from '@/components/Logo';

// Predefined login credentials for each role
const LOGIN_CREDENTIALS = {
  'super-admin': {
    email: 'superadmin@edusmarthub.com',
    password: 'SuperAdmin@2024',
    role: 'super-admin' as const,
    name: 'Super Administrator',
  },
  'school-admin': {
    email: 'schooladmin@edusmarthub.com',
    password: 'SchoolAdmin@2024',
    role: 'school-admin' as const,
    name: 'School Administrator',
  },
  'teacher': {
    email: 'teacher@edusmarthub.com',
    password: 'Teacher@2024',
    role: 'teacher' as const,
    name: 'Teacher',
  },
  'parent': {
    email: 'parent@edusmarthub.com',
    password: 'Parent@2024',
    role: 'parent' as const,
    name: 'Parent',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentRole } = useRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSchoolCode, setShowSchoolCode] = useState(false);
  const [language, setLanguage] = useState('en');

  // Detect role based on email
  const detectRole = (email: string): keyof typeof LOGIN_CREDENTIALS | null => {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('superadmin')) return 'super-admin';
    if (emailLower.includes('schooladmin')) return 'school-admin';
    if (emailLower.includes('teacher')) return 'teacher';
    if (emailLower.includes('parent')) return 'parent';
    return null;
  };

  // Show school code field for certain patterns
  useEffect(() => {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('@') && !emailLower.includes('edusmarthub.com')) {
      setShowSchoolCode(true);
    } else {
      setShowSchoolCode(false);
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate credentials
      const role = detectRole(email);
      if (!role) {
        setError('Invalid email. Please use a valid role email address.');
        setIsLoading(false);
        return;
      }

      const credentials = LOGIN_CREDENTIALS[role];
      
      // Check if credentials match
      if (email.toLowerCase() !== credentials.email.toLowerCase() || password !== credentials.password) {
        setError('Invalid email or password. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Set role in context
      setCurrentRole(credentials.role);

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        email: credentials.email,
        role: credentials.role,
        name: credentials.name,
      }));
      localStorage.setItem('token', 'mock-token-' + Date.now());
      localStorage.setItem('userId', 'user-' + credentials.role);

      toast.success(`Welcome, ${credentials.name}!`);

      // Route to appropriate dashboard
      switch (credentials.role) {
        case 'super-admin':
          navigate('/super-admin');
          break;
        case 'school-admin':
          navigate('/school-admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'parent':
          navigate('/parent');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      toast.error('Login failed', {
        description: err.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info('Google login coming soon');
  };

  const handleMicrosoftLogin = () => {
    toast.info('Microsoft login coming soon');
  };

  const applicationFeatures = [
    {
      icon: Bot,
      title: 'AI-Powered School Intelligence',
      description: 'Smart analytics that predict outcomes and automate operations',
    },
    {
      icon: Users,
      title: 'Real-time Parent Connection',
      description: 'Live updates and direct communication with teachers',
    },
    {
      icon: BarChart3,
      title: 'Complete Student Dashboard',
      description: '360° performance tracking with personalized insights',
    },
    {
      icon: School,
      title: 'Multi-School Management',
      description: 'Centralized control for educational institutions and chains',
    },
    {
      icon: Lightbulb,
      title: 'Smart Digital Campus',
      description: 'IoT-enabled infrastructure for modern, paperless schools',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - 50% - Application Details */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Top Section - Logo and Language */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <EduSmartHubLogo size={80} animated={true} />
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  EduSmartHub.in
                </h1>
                <p className="text-sm text-white/80" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  India's Intelligent Education Hub
                </p>
              </div>
            </div>
            
            {/* Language Selector */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'en' ? 'English' : 'हिंदी'}</span>
            </button>
          </div>

          {/* Center Section - Application Details */}
          <div className="flex-1 flex flex-col justify-center space-y-8 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                EduSmartHub - India's Intelligent Education Hub
              </h2>
            </motion.div>

            <div className="space-y-6">
              {applicationFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {feature.title}
                      </h3>
                      <p className="text-white/90 text-sm" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section - Trust Indicators */}
          <div className="flex items-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Reliable</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Trusted by 500+ Schools</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - 50% - Login Form */}
      <div className="w-full lg:w-1/2 bg-[#F9FAFB] flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <EduSmartHubLogo size={60} animated={false} />
              <div>
                <h2 className="text-2xl font-bold text-[#1F2937]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  EduSmartHub.in
                </h2>
                <p className="text-xs text-[#6B7280]">AI-Powered School Management</p>
              </div>
            </div>

            {/* Form Title */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#1F2937] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Welcome Back
              </h3>
              <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Sign in to your school's smart hub
              </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1F2937] text-sm font-medium">
                  Email or Username
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="school@email.com or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={cn(
                      "pl-12 h-12 rounded-lg border-2 bg-white",
                      "focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
                      error && "border-red-500"
                    )}
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1F2937] text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={cn(
                      "pl-12 pr-12 h-12 rounded-lg border-2 bg-white",
                      "focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20",
                      error && "border-red-500"
                    )}
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* School Code Field (Conditional) */}
              <AnimatePresence>
                {showSchoolCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="schoolCode" className="text-[#1F2937] text-sm font-medium">
                      School Code <span className="text-[#6B7280] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input
                        id="schoolCode"
                        type="text"
                        placeholder="School code (if provided)"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value)}
                        className="pl-12 h-12 rounded-lg border-2 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                        style={{ fontFamily: 'Open Sans, sans-serif' }}
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot Password & Request Access */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
                  onClick={() => toast.info('Password reset coming soon')}
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  className="text-[#6B7280] hover:text-[#1F2937] transition-colors"
                  onClick={() => toast.info('School access request coming soon')}
                >
                  Request School Access
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className={cn(
                  "w-full h-[52px] rounded-lg font-semibold text-white",
                  "bg-[#F59E0B] hover:bg-[#D97706]",
                  "transition-all duration-200 shadow-lg hover:shadow-xl",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ fontFamily: 'Poppins, sans-serif' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[#6B7280]">or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 hover:bg-gray-50"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 hover:bg-gray-50"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#7FBA00" d="M13 1h10v10H13z" />
                  <path fill="#00A4EF" d="M1 13h10v10H1z" />
                  <path fill="#FFB900" d="M13 13h10v10H13z" />
                </svg>
                <span className="text-sm font-medium">Microsoft</span>
              </Button>
            </div>

            {/* Footer */}
            <div className="space-y-4 pt-6 border-t border-[#E5E7EB]">
              <p className="text-center text-sm text-[#6B7280]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-[#2563EB] hover:text-[#1D4ED8] font-medium"
                  onClick={() => toast.info('Please contact your school administrator')}
                >
                  Contact School Admin
                </button>
              </p>
              
              <div className="flex items-center justify-center gap-4 text-xs text-[#6B7280]">
                <button
                  type="button"
                  className="hover:text-[#1F2937] transition-colors"
                  onClick={() => toast.info('Privacy Policy coming soon')}
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  className="hover:text-[#1F2937] transition-colors"
                  onClick={() => toast.info('Terms of Service coming soon')}
                >
                  Terms of Service
                </button>
              </div>
              
              <p className="text-center text-xs text-[#6B7280]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                © 2024 EduSmartHub.in - All rights reserved
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile View - Stacked Layout */}
      <div className="lg:hidden w-full min-h-screen bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex flex-col">
        {/* Mobile Header */}
        <div className="p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <EduSmartHubLogo size={50} animated={false} />
              <div>
                <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  EduSmartHub.in
                </span>
                <p className="text-xs text-white/80">India's Intelligent Education Hub</p>
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="p-2 rounded-lg bg-white/10"
            >
              <Globe className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Application Features */}
        <div className="px-6 pb-6 text-white space-y-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
            EduSmartHub - India's Intelligent Education Hub
          </h2>
          <div className="space-y-3">
            {applicationFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-white/10">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs text-white/90">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Form */}
        <div className="flex-1 bg-white rounded-t-3xl p-6">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#1F2937] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Welcome Back
              </h3>
              <p className="text-sm text-[#6B7280]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Sign in to your school's smart hub
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email-mobile" className="text-[#1F2937] text-sm font-medium">
                  Email or Username
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <Input
                    id="email-mobile"
                    type="email"
                    placeholder="school@email.com or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-12 rounded-lg border-2"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password-mobile" className="text-[#1F2937] text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <Input
                    id="password-mobile"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 pr-12 h-12 rounded-lg border-2"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* School Code (if shown) */}
              <AnimatePresence>
                {showSchoolCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="schoolCode-mobile" className="text-[#1F2937] text-sm font-medium">
                      School Code <span className="text-[#6B7280] font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <Input
                        id="schoolCode-mobile"
                        type="text"
                        placeholder="School code (if provided)"
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value)}
                        className="pl-12 h-12 rounded-lg border-2"
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium"
                  onClick={() => toast.info('Password reset coming soon')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-[52px] rounded-lg font-semibold text-white bg-[#F59E0B] hover:bg-[#D97706]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Social Login - Mobile */}
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-[#6B7280]">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <span className="text-sm">Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={handleMicrosoftLogin}
                  disabled={isLoading}
                >
                  <span className="text-sm">Microsoft</span>
                </Button>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-center">
              <p className="text-xs text-[#6B7280] mb-2">
                Don't have an account? Contact School Admin
              </p>
              <p className="text-xs text-[#6B7280]">
                © 2024 EduSmartHub.in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
