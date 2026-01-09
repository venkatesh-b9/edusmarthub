import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { School } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        // Redirect to appropriate dashboard based on role
        switch (userData.role) {
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
            navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <School className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
        <p className="text-white">Redirecting to login...</p>
      </motion.div>
    </div>
  );
}
